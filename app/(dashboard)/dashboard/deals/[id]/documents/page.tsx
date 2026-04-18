'use client'

import { use, useCallback, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Search, Filter, Grid, List, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { DOCUMENT_CATEGORIES, type DocumentCategory } from '@/lib/types'
import { DocumentUploader } from '@/components/documents/document-uploader'
import { DocumentCard } from '@/components/documents/document-card'
import { DocumentViewer } from '@/components/documents/document-viewer'

interface PageProps {
  params: Promise<{ id: string }>
}

function isDocumentCategory(value: unknown): value is DocumentCategory {
  return typeof value === 'string' && value in DOCUMENT_CATEGORIES
}

export default function DocumentsPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const {
    getDeal,
    getDocumentsByDeal,
    getDRLByDeal,
    deleteDocument,
    currentUser,
    logActivity,
    updateDocument,
    addExtraction,
  } = useAppStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [aiBusyDocId, setAiBusyDocId] = useState<string | null>(null)

  const deal = getDeal(dealId)
  const documents = getDocumentsByDeal(dealId)
  const drlItems = getDRLByDeal(dealId)
  const missingFromDrl = drlItems.filter(
    (i) =>
      i.priority === 'required' &&
      (i.status === 'requested' || i.status === 'not_requested') &&
      !i.documentId
  )
  const pendingReviewDrl = drlItems.filter((i) => i.status === 'received' || i.status === 'under_review')

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categoryCounts = documents.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleDelete = (docId: string) => {
    if (!currentUser) return
    if (confirm('Are you sure you want to delete this document?')) {
      const doc = documents.find(d => d.id === docId)
      if (doc) {
        logActivity({
          dealId,
          userId: currentUser.id,
          action: 'deleted',
          details: `Deleted ${doc.name}`,
          entityType: 'document',
          entityId: docId,
        })
      }
      deleteDocument(docId)
    }
  }

  const handleClassify = useCallback(
    async (docId: string) => {
      const doc = documents.find((d) => d.id === docId)
      if (!doc || !currentUser) {
        toast.error('Sign in required', { description: 'You must be signed in to classify documents.' })
        return
      }
      setAiBusyDocId(docId)
      try {
        const res = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentName: doc.name,
            documentText: doc.extractedText ?? '',
          }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          category?: unknown
          confidence?: unknown
          rationale?: unknown
          error?: string
        }
        if (!res.ok || data.ok === false) {
          toast.error('Classification failed', { description: data.error ?? `HTTP ${res.status}` })
          return
        }
        if (!isDocumentCategory(data.category) || typeof data.confidence !== 'number') {
          toast.error('Classification failed', { description: 'Unexpected response from the classifier.' })
          return
        }
        updateDocument(docId, {
          category: data.category,
          classificationConfidence: data.confidence,
        })
        logActivity({
          dealId,
          userId: currentUser.id,
          action: 'classified',
          details: `AI classified "${doc.name}" as ${DOCUMENT_CATEGORIES[data.category].label}`,
          entityType: 'document',
          entityId: docId,
        })
        toast.success('Document classified', {
          description:
            typeof data.rationale === 'string' ? data.rationale : `${DOCUMENT_CATEGORIES[data.category].label} (${Math.round(data.confidence * 100)}% confidence)`,
        })
      } catch {
        toast.error('Classification failed', { description: 'Network error. Try again.' })
      } finally {
        setAiBusyDocId(null)
      }
    },
    [currentUser, dealId, documents, logActivity, updateDocument]
  )

  const handleExtract = useCallback(
    async (docId: string) => {
      const doc = documents.find((d) => d.id === docId)
      if (!doc || !currentUser) {
        toast.error('Sign in required', { description: 'You must be signed in to run extraction.' })
        return
      }
      setAiBusyDocId(docId)
      try {
        const res = await fetch('/api/ai/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: doc.id,
            documentText: doc.extractedText ?? doc.name,
            category: doc.category,
          }),
        })
        const data = (await res.json()) as {
          success?: boolean
          extractions?: Array<{
            fieldName: string
            fieldCategory: string
            value: string
            confidence: number
            pageRef: number
          }>
          error?: string
        }
        if (!res.ok || data.success === false || !Array.isArray(data.extractions)) {
          toast.error('Extraction failed', { description: data.error ?? `HTTP ${res.status}` })
          return
        }
        for (const ext of data.extractions) {
          addExtraction({
            documentId: doc.id,
            dealId: doc.dealId,
            fieldName: ext.fieldName,
            fieldCategory: ext.fieldCategory,
            value: ext.value,
            originalValue: ext.value,
            confidence: ext.confidence,
            pageRef: ext.pageRef,
            status: 'pending',
          })
        }
        const preview = data.extractions.map((e) => `${e.fieldName}: ${e.value}`).join('\n')
        updateDocument(docId, {
          extractedText: doc.extractedText ?? preview.slice(0, 1200),
          ocrProcessed: true,
        })
        logActivity({
          dealId,
          userId: currentUser.id,
          action: 'extracted',
          details: `AI extraction queued ${data.extractions.length} field(s) for "${doc.name}"`,
          entityType: 'document',
          entityId: docId,
        })
        toast.success('Extraction complete', {
          description: `${data.extractions.length} field row(s) added to Raw AI extractions for review.`,
        })
      } catch {
        toast.error('Extraction failed', { description: 'Network error. Try again.' })
      } finally {
        setAiBusyDocId(null)
      }
    },
    [addExtraction, currentUser, dealId, documents, logActivity, updateDocument]
  )

  const viewingDoc = viewingDocument ? documents.find(d => d.id === viewingDocument) : null

  if (!deal) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium mb-2">Deal Not Found</h3>
          <Link href="/dashboard/deals">
            <Button variant="outline">Back to Deals</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/deals/${dealId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">Documents</h2>
            <p className="text-muted-foreground">{deal.name}</p>
          </div>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Documents
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Upload insurance diligence files (PDF, Word, Excel, or EML). PHI / non-PHI is tagged at intake.
              </DialogDescription>
            </DialogHeader>
            <DocumentUploader 
              dealId={dealId}
              onUploadComplete={() => {
                // Keep dialog open for multiple uploads
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing vs DRL</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <span className="font-medium text-foreground">{missingFromDrl.length}</span> required DRL items
              have no matching file yet.{' '}
              <span className="font-medium text-foreground">{pendingReviewDrl.length}</span> uploads are in review
              against a request.
            </p>
            <Button variant="link" className="h-auto p-0 text-primary" asChild>
              <Link href={`/dashboard/deals/${dealId}/drl`}>Open DRL tracker</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-classify</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            New uploads are routed to the insurance taxonomy (demo: keyword + model classifier). Low-confidence
            rows stay in &quot;Other&quot; until confirmed.
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label} {categoryCounts[key] ? `(${categoryCounts[key]})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-sm text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{Object.keys(categoryCounts).length}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {documents.filter(d => d.status === 'ready').length}
            </div>
            <p className="text-sm text-muted-foreground">Ready for Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {documents.filter(d => d.ocrProcessed).length}
            </div>
            <p className="text-sm text-muted-foreground">OCR Processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No documents found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload documents to get started'}
            </p>
            {!search && categoryFilter === 'all' && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                Upload Documents
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isAiBusy={aiBusyDocId === doc.id}
              onView={() => setViewingDocument(doc.id)}
              onDelete={() => handleDelete(doc.id)}
              onClassify={() => void handleClassify(doc.id)}
              onExtract={() => void handleExtract(doc.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4">
                  <DocumentCard
                    document={doc}
                    isAiBusy={aiBusyDocId === doc.id}
                    onView={() => setViewingDocument(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    onClassify={() => void handleClassify(doc.id)}
                    onExtract={() => void handleExtract(doc.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.name}</DialogTitle>
            <DialogDescription>
              {viewingDoc && DOCUMENT_CATEGORIES[viewingDoc.category]?.label}
            </DialogDescription>
          </DialogHeader>
          {viewingDoc && (
            <DocumentViewer document={viewingDoc} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
