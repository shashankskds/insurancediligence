'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  FileWarning,
  CheckCircle2,
  MessageSquare,
  MoreHorizontal,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import type { Finding, FindingType, FindingSeverity, FindingStatus, FindingReviewWorkflow } from '@/lib/types'
import { FINDING_REVIEW_LABELS, USER_ROLE_LABELS } from '@/lib/types'
import { formatDistanceToNow, formatDateTime } from '@/lib/date-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

/** Radix Select forbids `value=""` on items; map this sentinel to "no document" in state. */
const NO_RELATED_DOCUMENT = '__no_document__'

export default function FindingsPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { 
    getDeal, 
    getFindingsByDeal,
    getDocumentsByDeal,
    addFinding,
    updateFinding, 
    addNoteToFinding,
    getUser,
    currentUser,
    logActivity,
    users,
  } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [newNote, setNewNote] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newFinding, setNewFinding] = useState({
    title: '',
    description: '',
    type: 'risk' as FindingType,
    severity: 'medium' as FindingSeverity,
    documentId: '',
  })

  const deal = getDeal(dealId)
  const findings = getFindingsByDeal(dealId)
  const documents = getDocumentsByDeal(dealId)

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = 
      finding.title.toLowerCase().includes(search.toLowerCase()) ||
      finding.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || finding.type === typeFilter
    const matchesSeverity = severityFilter === 'all' || finding.severity === severityFilter
    const matchesStatus = statusFilter === 'all' || finding.status === statusFilter
    return matchesSearch && matchesType && matchesSeverity && matchesStatus
  })

  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical' && f.status === 'open').length,
    high: findings.filter(f => f.severity === 'high' && f.status === 'open').length,
    medium: findings.filter(f => f.severity === 'medium' && f.status === 'open').length,
    resolved: findings.filter(f => f.status === 'resolved').length,
  }

  const getSeverityIcon = (severity: FindingSeverity) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-5 w-5" />
      case 'medium':
        return <AlertCircle className="h-5 w-5" />
      case 'low':
        return <FileWarning className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: FindingSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive bg-destructive/10'
      case 'high':
        return 'text-destructive/80 bg-destructive/5'
      case 'medium':
        return 'text-warning-foreground bg-warning/10'
      case 'low':
        return 'text-muted-foreground bg-muted'
      case 'info':
        return 'text-primary bg-primary/10'
    }
  }

  const diligenceTier = (s: FindingSeverity) => {
    if (s === 'critical' || s === 'high') return 'High'
    if (s === 'medium') return 'Medium'
    return 'Low'
  }

  const getTypeLabel = (type: FindingType) => {
    switch (type) {
      case 'risk': return 'Risk'
      case 'gap': return 'Gap'
      case 'alert': return 'Alert'
      case 'observation': return 'Observation'
    }
  }

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline">Open</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">Acknowledged</Badge>
      case 'resolved':
        return <Badge className="bg-success/10 text-success">Resolved</Badge>
      case 'dismissed':
        return <Badge variant="outline" className="text-muted-foreground">Dismissed</Badge>
    }
  }

  const handleAddNote = () => {
    if (!currentUser || !selectedFinding || !newNote.trim()) return
    addNoteToFinding(selectedFinding.id, newNote.trim(), currentUser.id)
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'added_note',
      details: `Added note to finding: ${selectedFinding.title}`,
      entityType: 'finding',
      entityId: selectedFinding.id,
    })
    setNewNote('')
    // Refresh the selected finding
    const updated = getFindingsByDeal(dealId).find(f => f.id === selectedFinding.id)
    if (updated) setSelectedFinding(updated)
  }

  const handleStatusChange = (finding: Finding, newStatus: FindingStatus) => {
    if (!currentUser) return
    updateFinding(finding.id, { 
      status: newStatus,
      ...(newStatus === 'resolved' ? { resolvedAt: new Date().toISOString(), resolvedBy: currentUser.id } : {})
    })
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'updated',
      details: `Changed finding status to ${newStatus}: ${finding.title}`,
      entityType: 'finding',
      entityId: finding.id,
    })
  }

  const handleCreateFinding = () => {
    if (!currentUser || !newFinding.title.trim()) return
    const finding = addFinding({
      dealId,
      title: newFinding.title,
      description: newFinding.description,
      type: newFinding.type,
      severity: newFinding.severity,
      status: 'open',
      documentId: newFinding.documentId || undefined,
      createdBy: currentUser.id,
    })
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'created',
      details: `Created finding: ${newFinding.title}`,
      entityType: 'finding',
      entityId: finding.id,
    })
    setCreateDialogOpen(false)
    setNewFinding({ title: '', description: '', type: 'risk', severity: 'medium', documentId: '' })
  }

  const handleWorkflowChange = (findingId: string, reviewWorkflow: FindingReviewWorkflow) => {
    updateFinding(findingId, { reviewWorkflow })
    logActivity({
      dealId,
      userId: currentUser?.id ?? '',
      action: 'updated',
      details: `Set finding workflow to ${FINDING_REVIEW_LABELS[reviewWorkflow]}`,
      entityType: 'finding',
      entityId: findingId,
    })
    const updated = getFindingsByDeal(dealId).find((f) => f.id === findingId)
    if (updated && selectedFinding?.id === findingId) setSelectedFinding(updated)
  }

  const handleAssigneeChange = (findingId: string, assignedTo: string) => {
    updateFinding(findingId, { assignedTo: assignedTo === '_unassigned_' ? undefined : assignedTo })
    logActivity({
      dealId,
      userId: currentUser?.id ?? '',
      action: 'updated',
      details: 'Updated finding owner',
      entityType: 'finding',
      entityId: findingId,
    })
    const updated = getFindingsByDeal(dealId).find((f) => f.id === findingId)
    if (updated && selectedFinding?.id === findingId) setSelectedFinding(updated)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
            <h2 className="text-2xl font-bold">Validated findings</h2>
            <p className="text-muted-foreground">{deal.name}</p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Finding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Finding</DialogTitle>
              <DialogDescription>
                Document a risk, gap, or observation for this deal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newFinding.title}
                  onChange={(e) => setNewFinding(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief summary of the finding"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newFinding.type}
                    onValueChange={(value: FindingType) => setNewFinding(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="risk">Risk</SelectItem>
                      <SelectItem value="gap">Gap</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <Select
                    value={newFinding.severity}
                    onValueChange={(value: FindingSeverity) => setNewFinding(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Related Document (Optional)</label>
                <Select
                  value={newFinding.documentId || NO_RELATED_DOCUMENT}
                  onValueChange={(value) =>
                    setNewFinding((prev) => ({
                      ...prev,
                      documentId: value === NO_RELATED_DOCUMENT ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_RELATED_DOCUMENT}>None</SelectItem>
                    {documents.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newFinding.description}
                  onChange={(e) => setNewFinding(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the finding..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFinding} disabled={!newFinding.title.trim()}>
                Create Finding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium">From raw extractions to signed-off issues</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Raw AI extractions capture candidate values from documents. Validated findings are reviewer-owned
            conclusions, gaps, and red flags. When a finding is promoted from an extraction, it stays linked for
            audit. Review pending rows in{' '}
            <Link href={`/dashboard/deals/${dealId}/extractions`} className="text-primary underline-offset-4 hover:underline">
              raw AI extractions
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Findings</p>
          </CardContent>
        </Card>
        <Card className={stats.critical > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
            <p className="text-sm text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className={stats.high > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive/80">{stats.high}</div>
            <p className="text-sm text-muted-foreground">High</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning-foreground">{stats.medium}</div>
            <p className="text-sm text-muted-foreground">Medium</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
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
                placeholder="Search findings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                  <SelectItem value="gap">Gap</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Findings Column */}
        <div className="space-y-4">
          {filteredFindings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-1">No findings found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || typeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No findings have been recorded yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFindings.map((finding) => {
              const creator = getUser(finding.createdBy)
              const relatedDoc = finding.documentId ? documents.find(d => d.id === finding.documentId) : null
              
              return (
                <Card 
                  key={finding.id} 
                  className={`cursor-pointer transition-all ${
                    selectedFinding?.id === finding.id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFinding(finding)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 p-2 rounded-lg ${getSeverityColor(finding.severity)}`}>
                        {getSeverityIcon(finding.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-medium truncate">{finding.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline">{getTypeLabel(finding.type)}</Badge>
                              <Badge variant="secondary" className={getSeverityColor(finding.severity)}>
                                {diligenceTier(finding.severity)}
                              </Badge>
                              {finding.reviewWorkflow && (
                                <Badge variant="outline" className="text-xs">
                                  {FINDING_REVIEW_LABELS[finding.reviewWorkflow]}
                                </Badge>
                              )}
                              {finding.assignedTo && (
                                <span className="text-xs text-muted-foreground">
                                  Owner: {getUser(finding.assignedTo)?.name ?? '—'}
                                </span>
                              )}
                              {finding.sourceExtractionId && (
                                <Badge variant="outline" className="text-xs border-dashed">
                                  From extraction
                                </Badge>
                              )}
                              {getStatusBadge(finding.status)}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {finding.status === 'open' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(finding, 'acknowledged'); }}>
                                    Mark Acknowledged
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(finding, 'resolved'); }}>
                                    Mark Resolved
                                  </DropdownMenuItem>
                                </>
                              )}
                              {finding.status === 'acknowledged' && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(finding, 'resolved'); }}>
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(finding, 'dismissed'); }}>
                                Dismiss
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {finding.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {relatedDoc && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {relatedDoc.name.slice(0, 20)}...
                            </span>
                          )}
                          {finding.notes.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {finding.notes.length}
                            </span>
                          )}
                          <span>{formatDistanceToNow(finding.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:sticky lg:top-6 space-y-4">
          {selectedFinding ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedFinding.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Created by {getUser(selectedFinding.createdBy)?.name} on {formatDateTime(selectedFinding.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className={getSeverityColor(selectedFinding.severity)}>
                      {diligenceTier(selectedFinding.severity)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{getTypeLabel(selectedFinding.type)}</Badge>
                    {getStatusBadge(selectedFinding.status)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Review workflow</p>
                      <Select
                        value={selectedFinding.reviewWorkflow ?? 'under_review'}
                        onValueChange={(v: FindingReviewWorkflow) =>
                          handleWorkflowChange(selectedFinding.id, v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(FINDING_REVIEW_LABELS) as FindingReviewWorkflow[]).map((k) => (
                            <SelectItem key={k} value={k}>
                              {FINDING_REVIEW_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <Select
                        value={selectedFinding.assignedTo ?? '_unassigned_'}
                        onValueChange={(v) => handleAssigneeChange(selectedFinding.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_unassigned_">Unassigned</SelectItem>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({USER_ROLE_LABELS[u.role]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-sm">{selectedFinding.description}</p>
                  {selectedFinding.documentId && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Related Document</p>
                      <p className="text-sm font-medium">
                        {documents.find(d => d.id === selectedFinding.documentId)?.name}
                      </p>
                      {selectedFinding.pageRef && (
                        <p className="text-xs text-muted-foreground">Page {selectedFinding.pageRef}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes ({selectedFinding.notes.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedFinding.notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedFinding.notes.map((note) => {
                        const author = getUser(note.createdBy)
                        return (
                          <div key={note.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {author ? getInitials(author.name) : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{author?.name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(note.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{note.content}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                  >
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Select a finding to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
