import { spawn } from "child_process";
import { mkdtemp, readFile, rm, writeFile, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

interface TranscodeResult {
  url: string;
  pathname: string;
  contentType: "video/mp4";
  sizeBytes: number;
}

/**
 * Downloads a video blob, transcodes it to H.264 MP4 at 720p with AAC audio
 * using ffmpeg's ultrafast preset, uploads the MP4 to Vercel Blob, and
 * returns the new blob reference.
 *
 * Uses ultrafast preset + crf 26 for speed — a 5-min iPhone HEVC .mov
 * transcodes in roughly 30-50 seconds on Vercel Pro's serverless CPU,
 * which fits inside the 60s function timeout.
 */
export async function transcodeVideoToMp4(
  inputUrl: string,
  ownerUserId: string,
): Promise<TranscodeResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "ll-transcode-"));
  const inputPath = path.join(workDir, "input.bin");
  const outputPath = path.join(workDir, "output.mp4");

  try {
    // Download source from Blob to local /tmp
    const res = await fetch(inputUrl);
    if (!res.ok) {
      throw new Error(`Failed to download source video: HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(inputPath, buf);

    // Run ffmpeg.
    //
    // -map 0:v:0 / -map 0:a:0? : iPhone .mov files include a third
    // metadata track (motion / accelerometer data) with codec="none"
    // that would crash ffmpeg if left in. Explicitly map only the first
    // video and (optional) first audio stream. The "?" suffix on audio
    // makes it tolerate audio-less inputs.
    const args = [
      "-y", // overwrite output
      "-hide_banner",
      "-loglevel", "error",
      "-i", inputPath,
      "-map", "0:v:0",
      "-map", "0:a:0?",
      "-vf", "scale=-2:720", // cap height at 720, preserve aspect ratio (-2 = even-aligned width)
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-crf", "26",
      "-pix_fmt", "yuv420p", // browser-safe pixel format
      "-movflags", "+faststart", // metadata at front for streaming
      "-c:a", "aac",
      "-b:a", "128k",
      "-ac", "2", // stereo
      outputPath,
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegInstaller.path, args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";
      proc.stderr?.on("data", (d) => { stderr += d.toString(); });
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
      });
    });

    const outputBuf = await readFile(outputPath);
    const outputStat = await stat(outputPath);

    const pathname = `shareable/${ownerUserId}/${randomUUID()}.mp4`;
    const { url } = await put(pathname, outputBuf, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      cacheControlMaxAge: 60,
    });

    return {
      url,
      pathname,
      contentType: "video/mp4",
      sizeBytes: outputStat.size,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
