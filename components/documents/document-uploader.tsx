'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import type { DocumentCategory, Document } from '@/lib/types'

interface FileUpload {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  documentId?: string
}

interface DocumentUploaderProps {
  dealId: string
  onUploadComplete?: (document: Document) => void
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'message/rfc822': ['.eml'],
  'application/octet-stream': ['.eml'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export function DocumentUploader({ dealId, onUploadComplete }: DocumentUploaderProps) {
  const { currentUser, addDocument, logActivity } = useAppStore()
  const [uploads, setUploads] = useState<FileUpload[]>([])

  const getFileType = (file: File): Document['type'] => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'pdf'
      case 'docx': return 'docx'
      case 'doc': return 'doc'
      case 'xlsx': return 'xlsx'
      case 'xls': return 'xls'
      case 'eml': return 'eml'
      default: return 'pdf'
    }
  }

  const inferPhi = (fileName: string): Document['phiSensitivity'] => {
    const n = fileName.toLowerCase()
    if (n.includes('census') || n.includes('enrollment') || n.includes('hipaa') || n.includes('rxdc')) {
      return 'phi'
    }
    return 'non_phi'
  }

  const simulateUpload = async (fileUpload: FileUpload) => {
    if (!currentUser) return

    // Update to uploading status
    setUploads(prev => prev.map(u => 
      u.id === fileUpload.id ? { ...u, status: 'uploading' } : u
    ))

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setUploads(prev => prev.map(u => 
        u.id === fileUpload.id ? { ...u, progress } : u
      ))
    }

    // Update to processing status
    setUploads(prev => prev.map(u => 
      u.id === fileUpload.id ? { ...u, status: 'processing' } : u
    ))

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const isEml = fileUpload.file.name.toLowerCase().endsWith('.eml')
    const doc = addDocument({
      dealId,
      name: fileUpload.file.name,
      type: getFileType(fileUpload.file),
      category: 'other',
      status: 'ready',
      uploadedBy: currentUser.id,
      blobUrl: URL.createObjectURL(fileUpload.file),
      fileSize: fileUpload.file.size,
      ocrProcessed: false,
      phiSensitivity: inferPhi(fileUpload.file.name),
    })

    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'uploaded',
      details: `Uploaded ${fileUpload.file.name}`,
      entityType: 'document',
      entityId: doc.id,
    })

    if (isEml) {
      const base = fileUpload.file.name.replace(/\.eml$/i, '')
      const attachments: Array<{ name: string; type: Document['type']; category: Document['category'] }> = [
        { name: `Attachment: Schedule_of_Limits.pdf (from ${base})`, type: 'pdf', category: 'policy_documents' },
        { name: `Attachment: WC_payroll_extract.xlsx (from ${base})`, type: 'xlsx', category: 'wc_payroll_reports' },
      ]
      attachments.forEach((a) => {
        const child = addDocument({
          dealId,
          name: a.name,
          type: a.type,
          category: a.category,
          status: 'ready',
          uploadedBy: currentUser.id,
          blobUrl: `/demo/${a.type === 'pdf' ? 'attachment.pdf' : 'attachment.xlsx'}`,
          fileSize: 125000,
          pageCount: a.type === 'pdf' ? 4 : 2,
          ocrProcessed: false,
          classificationConfidence: 0.9,
          phiSensitivity: 'non_phi',
          extractedFromDocumentId: doc.id,
        })
        logActivity({
          dealId,
          userId: currentUser.id,
          action: 'created',
          details: `Extracted attachment from email package: ${a.name}`,
          entityType: 'document',
          entityId: child.id,
        })
      })
    }

    // Update to complete status
    setUploads(prev => prev.map(u => 
      u.id === fileUpload.id ? { ...u, status: 'complete', documentId: doc.id } : u
    ))

    toast.success('File ready', {
      description: `${fileUpload.file.name} is in the data room.`,
    })
    onUploadComplete?.(doc)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: FileUpload[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 15),
      progress: 0,
      status: 'pending',
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Start uploading each file
    newUploads.forEach(upload => {
      simulateUpload(upload)
    })
  }, [dealId, currentUser])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      rejections.forEach(rejection => {
        const error = rejection.errors[0]
        const errorMessage = error.code === 'file-too-large' 
          ? 'File is too large (max 50MB)'
          : error.code === 'file-invalid-type'
          ? 'Invalid file type'
          : error.message

        setUploads(prev => [...prev, {
          file: rejection.file,
          id: Math.random().toString(36).substring(2, 15),
          progress: 0,
          status: 'error',
          error: errorMessage,
        }])
      })
    },
  })

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(u => u.status !== 'complete' && u.status !== 'error'))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusIcon = (status: FileUpload['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supported: PDF, Word, Excel, and EML (RFC822). EML packages simulate attachment extraction in this demo. Max 50MB.
        </p>
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploads</p>
            {uploads.some(u => u.status === 'complete' || u.status === 'error') && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                {getStatusIcon(upload.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(upload.file.size)}</span>
                    {upload.status === 'uploading' && (
                      <span>{upload.progress}%</span>
                    )}
                    {upload.status === 'processing' && (
                      <span>Processing...</span>
                    )}
                    {upload.status === 'complete' && (
                      <span className="text-success">Complete</span>
                    )}
                    {upload.status === 'error' && (
                      <span className="text-destructive">{upload.error}</span>
                    )}
                  </div>
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="h-1 mt-2" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeUpload(upload.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
