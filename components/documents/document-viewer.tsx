'use client'

import { useState } from 'react'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, FileSpreadsheet, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Document } from '@/lib/types'

interface DocumentViewerProps {
  document: Document
  highlightPage?: number
}

export function DocumentViewer({ document, highlightPage }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(highlightPage || 1)
  const [zoom, setZoom] = useState(100)

  const totalPages = document.pageCount || 1

  // In demo mode, we show a placeholder viewer
  // In production, this would use react-pdf or similar

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const getFileIcon = () => {
    switch (document.type) {
      case 'pdf':
        return <FileText className="h-16 w-16 text-destructive/70" />
      case 'docx':
      case 'doc':
        return <FileText className="h-16 w-16 text-primary/70" />
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-16 w-16 text-success/70" />
      case 'eml':
        return <Mail className="h-16 w-16 text-chart-2/80" />
      default:
        return <FileText className="h-16 w-16 text-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 50}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 200}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Badge variant="outline">{document.type.toUpperCase()}</Badge>
          {document.ocrProcessed && (
            <Badge variant="secondary">OCR Processed</Badge>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="flex-1 overflow-auto bg-muted/20 p-6">
        <div 
          className="mx-auto bg-card rounded-lg shadow-lg border border-border"
          style={{ 
            width: `${600 * (zoom / 100)}px`,
            minHeight: `${800 * (zoom / 100)}px`,
          }}
        >
          {/* Demo placeholder - in production this would render actual document */}
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            {getFileIcon()}
            <h3 className="text-lg font-medium mt-4 mb-2">{document.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Document preview would appear here
            </p>
            
            {document.extractedText ? (
              <div className="mt-4 p-4 bg-muted rounded-lg w-full max-w-md text-left">
                <p className="text-xs font-medium text-muted-foreground mb-2">Extracted Text Preview:</p>
                <p className="text-sm line-clamp-6">{document.extractedText}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>No text extracted yet</span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="text-muted-foreground">File Size</p>
                <p className="font-medium">
                  {document.fileSize < 1024 * 1024 
                    ? `${(document.fileSize / 1024).toFixed(1)} KB`
                    : `${(document.fileSize / (1024 * 1024)).toFixed(1)} MB`
                  }
                </p>
              </div>
              {document.pageCount && (
                <div className="text-left">
                  <p className="text-muted-foreground">Pages</p>
                  <p className="font-medium">{document.pageCount}</p>
                </div>
              )}
              {document.classificationConfidence && (
                <div className="text-left col-span-2">
                  <p className="text-muted-foreground">Classification Confidence</p>
                  <p className="font-medium">{Math.round(document.classificationConfidence * 100)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
