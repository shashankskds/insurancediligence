'use client'

import { FileText, FileSpreadsheet, File, MoreHorizontal, Eye, Trash2, Brain, Tag, Mail, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Document } from '@/lib/types'
import { DOCUMENT_CATEGORIES } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { formatDistanceToNow } from '@/lib/date-utils'

interface DocumentCardProps {
  document: Document
  onView?: () => void
  onDelete?: () => void
  onClassify?: () => void
  onExtract?: () => void
  /** Disables AI actions while a classify/extract request is in flight for this card */
  isAiBusy?: boolean
}

export function DocumentCard({
  document,
  onView,
  onDelete,
  onClassify,
  onExtract,
  isAiBusy = false,
}: DocumentCardProps) {
  const { currentUser } = useAppStore()
  const phiRestricted =
    document.phiSensitivity === 'phi' && currentUser?.role === 'analyst'

  const getFileIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-destructive/70" />
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-primary/70" />
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-8 w-8 text-success/70" />
      case 'eml':
        return <Mail className="h-8 w-8 text-chart-2/80" />
      default:
        return <File className="h-8 w-8 text-muted-foreground" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = () => {
    switch (document.status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'ocr_pending':
        return <Badge variant="outline">OCR Pending</Badge>
      case 'ocr_processing':
        return <Badge variant="secondary">OCR Processing</Badge>
      case 'ready':
        return null
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {phiRestricted && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-warning/50 bg-warning/5 px-2 py-1.5 mb-3 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0 text-warning-foreground" />
            PHI — download and external share require Team Lead or Admin approval (demo policy).
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-2 rounded-lg bg-muted">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-medium truncate" title={document.name}>
                  {document.name}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {DOCUMENT_CATEGORIES[document.category]?.label || 'Uncategorized'}
                  </Badge>
                  {document.phiSensitivity === 'phi' && (
                    <Badge variant="destructive" className="text-xs">
                      PHI
                    </Badge>
                  )}
                  {document.phiSensitivity === 'non_phi' && (
                    <Badge variant="secondary" className="text-xs">
                      Non-PHI
                    </Badge>
                  )}
                  {document.extractedFromDocumentId && (
                    <Badge variant="outline" className="text-xs border-dashed">
                      From EML
                    </Badge>
                  )}
                  {getStatusBadge()}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={isAiBusy}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isAiBusy || !onClassify}
                    onSelect={() => {
                      onClassify?.()
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Classify
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isAiBusy || !onExtract}
                    onSelect={() => {
                      onExtract?.()
                    }}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Extract Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span>{formatFileSize(document.fileSize)}</span>
              {document.pageCount && <span>{document.pageCount} pages</span>}
              <span>{formatDistanceToNow(document.uploadedAt)}</span>
            </div>
            {document.classificationConfidence && (
              <div className="mt-2 text-xs text-muted-foreground">
                Classification confidence: {Math.round(document.classificationConfidence * 100)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
