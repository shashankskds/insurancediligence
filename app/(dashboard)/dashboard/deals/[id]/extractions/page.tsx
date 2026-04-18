'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Pencil,
  FileText,
  Brain,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import {
  EXTRACTION_STATUS_LABELS,
  EXTRACTION_UNCERTAINTY_THRESHOLD,
  type Extraction,
  type ExtractionStatus,
} from '@/lib/types'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ExtractionsPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { 
    getDeal, 
    getExtractionsByDeal, 
    getDocumentsByDeal,
    updateExtraction, 
    currentUser,
    logActivity 
  } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingExtraction, setEditingExtraction] = useState<Extraction | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editReason, setEditReason] = useState('')

  const deal = getDeal(dealId)
  const extractions = getExtractionsByDeal(dealId)
  const documents = getDocumentsByDeal(dealId)

  const getDocumentName = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    return doc?.name || 'Unknown Document'
  }

  const filteredExtractions = extractions.filter(ext => {
    const matchesSearch = 
      ext.fieldName.toLowerCase().includes(search.toLowerCase()) ||
      ext.value.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ext.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || ext.fieldCategory === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const categories = [...new Set(extractions.map(e => e.fieldCategory))]
  
  const stats = {
    total: extractions.length,
    pending: extractions.filter(e => e.status === 'pending').length,
    accepted: extractions.filter(e => e.status === 'accepted').length,
    rejected: extractions.filter(e => e.status === 'rejected').length,
    edited: extractions.filter(e => e.status === 'edited').length,
    uncertain: extractions.filter(
      (e) => e.status === 'pending' && e.confidence < EXTRACTION_UNCERTAINTY_THRESHOLD
    ).length,
    humanValidated: extractions.filter((e) => e.status === 'accepted' || e.status === 'edited').length,
  }

  const reviewProgress = stats.total > 0 
    ? Math.round(((stats.accepted + stats.rejected + stats.edited) / stats.total) * 100)
    : 0

  const handleAccept = (extraction: Extraction) => {
    if (!currentUser) return
    updateExtraction(extraction.id, {
      status: 'accepted',
      reviewedBy: currentUser.id,
      reviewedAt: new Date().toISOString(),
    })
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'reviewed',
      details: `Accepted extraction: ${extraction.fieldName}`,
      entityType: 'extraction',
      entityId: extraction.id,
    })
    toast.success('Approved', { description: extraction.fieldName })
  }

  const handleReject = (extraction: Extraction) => {
    if (!currentUser) return
    updateExtraction(extraction.id, {
      status: 'rejected',
      reviewedBy: currentUser.id,
      reviewedAt: new Date().toISOString(),
    })
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'reviewed',
      details: `Rejected extraction: ${extraction.fieldName}`,
      entityType: 'extraction',
      entityId: extraction.id,
    })
    toast.message('Needs changes', { description: extraction.fieldName })
  }

  const handleEditClick = (extraction: Extraction) => {
    setEditingExtraction(extraction)
    setEditValue(extraction.value)
    setEditReason('')
  }

  const handleSaveEdit = () => {
    if (!currentUser || !editingExtraction) return
    updateExtraction(editingExtraction.id, {
      value: editValue,
      status: 'edited',
      reviewedBy: currentUser.id,
      reviewedAt: new Date().toISOString(),
      editReason,
    })
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'edited',
      details: `Edited extraction: ${editingExtraction.fieldName}`,
      entityType: 'extraction',
      entityId: editingExtraction.id,
    })
    setEditingExtraction(null)
    toast.success('Saved edit', { description: editingExtraction.fieldName })
  }

  const getStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">{EXTRACTION_STATUS_LABELS.pending}</Badge>
      case 'accepted':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">{EXTRACTION_STATUS_LABELS.accepted}</Badge>
      case 'rejected':
        return <Badge variant="destructive">{EXTRACTION_STATUS_LABELS.rejected}</Badge>
      case 'edited':
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{EXTRACTION_STATUS_LABELS.edited}</Badge>
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="outline" className="text-success border-success/30">High ({Math.round(confidence * 100)}%)</Badge>
    } else if (confidence >= 0.7) {
      return <Badge variant="outline" className="text-warning border-warning/30">Medium ({Math.round(confidence * 100)}%)</Badge>
    } else {
      return <Badge variant="outline" className="text-destructive border-destructive/30">Low ({Math.round(confidence * 100)}%)</Badge>
    }
  }

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
            <h2 className="text-2xl font-bold">Raw AI extractions</h2>
            <p className="text-muted-foreground">{deal.name}</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Machine-extracted line items and tables. Approved rows inform{' '}
              <Link href={`/dashboard/deals/${dealId}/findings`} className="text-primary underline-offset-4 hover:underline">
                validated findings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Validation progress</CardTitle>
            <span className="text-sm text-muted-foreground">
              {stats.accepted + stats.rejected + stats.edited} of {stats.total} dispositioned
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            <span className="font-medium text-foreground">{stats.humanValidated}</span> human-validated ·{' '}
            <span className="font-medium text-foreground">{stats.pending}</span> raw / pending ·{' '}
            {stats.uncertain > 0 && (
              <span className="text-warning-foreground">{stats.uncertain} flagged uncertain (below {Math.round(EXTRACTION_UNCERTAINTY_THRESHOLD * 100)}% confidence)</span>
            )}
          </p>
          <Progress value={reviewProgress} className="h-2 mb-4" />
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">{EXTRACTION_STATUS_LABELS.pending}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.accepted}</div>
              <div className="text-xs text-muted-foreground">{EXTRACTION_STATUS_LABELS.accepted}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.edited}</div>
              <div className="text-xs text-muted-foreground">{EXTRACTION_STATUS_LABELS.edited}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">{EXTRACTION_STATUS_LABELS.rejected}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search extractions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">{EXTRACTION_STATUS_LABELS.pending}</SelectItem>
                  <SelectItem value="accepted">{EXTRACTION_STATUS_LABELS.accepted}</SelectItem>
                  <SelectItem value="edited">{EXTRACTION_STATUS_LABELS.edited}</SelectItem>
                  <SelectItem value="rejected">{EXTRACTION_STATUS_LABELS.rejected}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extractions Table */}
      {filteredExtractions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No extractions found</h3>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Upload and process documents to extract data'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExtractions.map((extraction) => (
                  <TableRow key={extraction.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{extraction.fieldName}</p>
                        <p className="text-xs text-muted-foreground">{extraction.fieldCategory}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="truncate" title={extraction.value}>
                          {extraction.value}
                        </p>
                        {extraction.status === 'edited' && extraction.originalValue !== extraction.value && (
                          <p className="text-xs text-muted-foreground line-through truncate">
                            {extraction.originalValue}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm truncate max-w-[150px]" title={getDocumentName(extraction.documentId)}>
                            {getDocumentName(extraction.documentId)}
                          </p>
                          <p className="text-xs text-muted-foreground">Page {extraction.pageRef}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        {getConfidenceBadge(extraction.confidence)}
                        {extraction.status === 'pending' &&
                          extraction.confidence < EXTRACTION_UNCERTAINTY_THRESHOLD && (
                            <Badge variant="outline" className="text-xs border-warning text-warning-foreground">
                              Uncertain
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(extraction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {extraction.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success hover:text-success"
                              onClick={() => handleAccept(extraction)}
                              title="Approve"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditClick(extraction)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleReject(extraction)}
                              title="Needs changes"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {extraction.status !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditClick(extraction)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingExtraction} onOpenChange={(open) => !open && setEditingExtraction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Extraction</DialogTitle>
            <DialogDescription>
              Update the extracted value for {editingExtraction?.fieldName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Original Value</label>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded">
                {editingExtraction?.originalValue}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Value</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter corrected value"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for Change (Optional)</label>
              <Textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Explain why you're making this change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExtraction(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
