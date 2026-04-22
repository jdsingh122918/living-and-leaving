"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QrCode,
  Download,
  Copy,
  CheckCircle,
  Printer,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import QRCode from "qrcode";
import { QRCardPrintSheet } from "./qr-card-print-sheet";
import brandConfig from "@/brand.config";

interface ShareableDirectiveQRCardProps {
  // The permanent, URL-safe token from ShareableDirective.token
  token: string;
  ownerFirstName?: string | null;
  ownerLastName?: string | null;
}

// Renders the QR code + share controls for an already-finalized
// ShareableDirective. Does NOT handle generation or revocation — that lives
// in the owner controls / admin finalize flows. This component exists purely
// to display and print an existing share link.
export function ShareableDirectiveQRCard({
  token,
  ownerFirstName,
  ownerLastName,
}: ShareableDirectiveQRCardProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/share/${token}`);
  }, [token]);

  useEffect(() => {
    if (!shareUrl) {
      setQrCodeData(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then(setQrCodeData)
      .catch((err) => console.error("QR generation failed:", err));
  }, [shareUrl]);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleDownloadQR = useCallback(() => {
    if (!qrCodeData) return;
    const link = document.createElement("a");
    const slug = (brandConfig.shortName || brandConfig.name || "share")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    link.download = `${slug}-qr.png`;
    link.href = qrCodeData;
    link.click();
  }, [qrCodeData]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code &amp; Share Link
          </CardTitle>
          <CardDescription>
            Scan this QR or share the link to give someone access to this
            directive and any accompanying video.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeData && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeData}
                  alt="QR code for share link"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            {qrCodeData && (
              <Button
                size="sm"
                onClick={() => setShowPrintSheet(true)}
                className="min-h-[44px]"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print ID Cards
              </Button>
            )}

            {shareUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(shareUrl, "_blank")}
                className="min-h-[44px]"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="min-h-[44px]"
              disabled={!shareUrl}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </Button>

            {qrCodeData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQR}
                className="min-h-[44px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR
              </Button>
            )}
          </div>

          <Alert>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Anyone with this QR or link can view the directive and any
              accompanying video. Every scan is logged. The owner can revoke
              access at any time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {showPrintSheet && qrCodeData && (
        <QRCardPrintSheet
          ownerFirstName={ownerFirstName || "Directive"}
          ownerLastName={ownerLastName || "Owner"}
          qrCodeDataUrl={qrCodeData}
          onClose={() => setShowPrintSheet(false)}
        />
      )}
    </>
  );
}
