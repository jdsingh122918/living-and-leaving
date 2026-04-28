'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Trash2,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File as FileIcon,
  Loader2,
  Inbox,
} from 'lucide-react'

interface FileEntry {
  id: string
  title: string
  fileName: string
  mimeType: string
  fileSize: number | null
  uploadedAt: string
}

interface MemberFilesClientProps {
  initialFiles: FileEntry[]
}

function formatBytes(bytes: number | null): string {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

// Pick an icon by mime so members get visual orientation at a glance
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  const cls = 'h-5 w-5 text-muted-foreground shrink-0'
  if (mimeType.startsWith('image/')) return <ImageIcon className={cls} />
  if (mimeType.startsWith('video/')) return <Video className={cls} />
  if (mimeType.startsWith('audio/')) return <Music className={cls} />
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/'))
    return <FileText className={cls} />
  return <FileIcon className={cls} />
}

export function MemberFilesClient({ initialFiles }: MemberFilesClientProps) {
  const [files, setFiles] = useState<FileEntry[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || [])
    if (selected.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      for (const file of selected) {
        formData.append('files', file)
      }
      formData.append('category', 'documents')

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      // Optimistically prepend the uploaded files. Server has them; the next
      // page load will reconcile any details we couldn't infer client-side.
      const newEntries: FileEntry[] = data.files.map((f: {
        fileId: string
        originalName?: string
        fileName: string
        mimeType: string
        size: number | null
      }) => ({
        id: f.fileId,
        title: f.originalName || f.fileName,
        fileName: f.originalName || f.fileName,
        mimeType: f.mimeType,
        fileSize: f.size ?? null,
        uploadedAt: new Date().toISOString(),
      }))
      setFiles((prev) => [...newEntries, ...prev])
    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownload = (file: FileEntry) => {
    // Direct GET — browser handles auth via the existing session cookie
    const url = `/api/files/db/${file.id}`
    const a = document.createElement('a')
    a.href = url
    a.download = file.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (file: FileEntry) => {
    if (!confirm(`Delete "${file.fileName}"? This can't be undone.`)) return
    setDeletingId(file.id)
    setError(null)
    try {
      const response = await fetch(`/api/files/db/${file.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Delete failed')
      }
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
    } catch (err) {
      console.error('Delete failed:', err)
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Files</h2>
          <p className="text-muted-foreground">
            Upload and manage your personal files. Only you can see what&apos;s here.
          </p>
        </div>
        <Button
          onClick={handleUploadClick}
          disabled={uploading}
          className="min-h-[44px]"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>
            {files.length === 0
              ? "Nothing uploaded yet."
              : `${files.length} file${files.length === 1 ? '' : 's'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold">No files yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload PDFs, images, or any document you want to keep with your account.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <FileTypeIcon mimeType={file.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm break-all">{file.fileName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(file.uploadedAt)}</span>
                      <span>•</span>
                      <span>{formatBytes(file.fileSize)}</span>
                      {file.mimeType && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {file.mimeType.split('/')[1] || file.mimeType}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(file)}
                      className="min-h-[40px]"
                      aria-label="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(file)}
                      disabled={deletingId === file.id}
                      className="min-h-[40px] text-destructive hover:text-destructive"
                      aria-label="Delete file"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
