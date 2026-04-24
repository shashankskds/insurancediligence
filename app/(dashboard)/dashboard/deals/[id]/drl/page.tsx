'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ClipboardList, CheckCircle2, Clock, AlertCircle, FileX, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useAppStore } from '@/lib/store'
import { DOCUMENT_CATEGORIES, type DRLStatus, type DocumentCategory } from '@/lib/types'
import { downloadDrlAsXlsx } from '@/lib/demo/drl-export'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DRLPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { getDeal, getDRLByDeal, getDocumentsByDeal, updateDRLItem, currentUser, logActivity } = useAppStore()
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const deal = getDeal(dealId)
  const drlItems = getDRLByDeal(dealId)
  const documents = getDocumentsByDeal(dealId)

  const filteredItems = drlItems.filter(item => {
    const matchesSearch = item.documentName.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<DocumentCategory, typeof drlItems>)

  // Calculate stats
  const stats = {
    total: drlItems.length,
    complete: drlItems.filter(i => i.status === 'complete').length,
    received: drlItems.filter(i => i.status === 'received' || i.status === 'under_review').length,
    requested: drlItems.filter(i => i.status === 'requested').length,
    notRequested: drlItems.filter(i => i.status === 'not_requested').length,
    notApplicable: drlItems.filter(i => i.status === 'not_applicable').length,
    matchedToRoom: drlItems.filter(i => !!i.documentId).length,
    missingStillRequested: drlItems.filter(i => i.status === 'requested').length,
  }
  
  const progress = stats.total > 0 
    ? Math.round(((stats.complete + stats.notApplicable) / stats.total) * 100)
    : 0

  const handleStatusChange = (itemId: string, newStatus: DRLStatus) => {
    if (!currentUser) return
    const item = drlItems.find(i => i.id === itemId)
    if (!item) return
    
    updateDRLItem(itemId, { 
      status: newStatus,
      ...(newStatus === 'requested' ? { requestedAt: new Date().toISOString() } : {}),
      ...(newStatus === 'received' ? { receivedAt: new Date().toISOString() } : {}),
    })
    
    logActivity({
      dealId,
      userId: currentUser.id,
      action: 'updated',
      details: `Updated DRL status for "${item.documentName}" to ${newStatus.replace('_', ' ')}`,
      entityType: 'drl',
      entityId: itemId,
    })
  }

  const getStatusBadge = (status: DRLStatus) => {
    switch (status) {
      case 'not_requested':
        return <Badge variant="outline" className="text-muted-foreground">Not requested</Badge>
      case 'requested':
        return <Badge variant="outline" className="border-primary/50 text-primary">Pending</Badge>
      case 'received':
        return <Badge variant="secondary" className="bg-chart-2/10 text-chart-2">Under review</Badge>
      case 'under_review':
        return <Badge variant="secondary" className="bg-warning/10 text-warning-foreground">Under review</Badge>
      case 'complete':
        return <Badge className="bg-success/10 text-success">Approved</Badge>
      case 'not_applicable':
        return <Badge variant="outline" className="text-muted-foreground">N/A</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'required':
        return <Badge variant="destructive" className="text-xs">Required</Badge>
      case 'important':
        return <Badge variant="secondary" className="text-xs">Important</Badge>
      case 'optional':
        return <Badge variant="outline" className="text-xs text-muted-foreground">Optional</Badge>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/deals/${dealId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold">DRL tracker</h2>
            <p className="text-muted-foreground">{deal.name}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => {
            downloadDrlAsXlsx(deal.name, drlItems)
            toast.success('DRL exported', { description: 'Excel file downloaded (demo).' })
          }}
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="py-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Reminders & escalations (demo)</p>
          <p>
            Outstanding requests past SLA would trigger email reminders to the sponsor data room owner, with
            optional escalation to the PE buyer deal team after a defined hold period.
          </p>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">DRL completion</CardTitle>
            <span className="text-sm text-muted-foreground">
              {stats.complete + stats.notApplicable} of {stats.total} satisfied · {progress}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground mb-4">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide">Matched to data room</p>
              <p className="text-lg font-semibold text-foreground">{stats.matchedToRoom}</p>
              <p className="text-xs">Requests linked to an uploaded file</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide">Missing (still requested)</p>
              <p className="text-lg font-semibold text-foreground">{stats.missingStillRequested}</p>
              <p className="text-xs">Outstanding sponsor deliverables</p>
            </div>
            <div className="rounded-md border border-border p-3 col-span-2 md:col-span-1">
              <p className="text-xs uppercase tracking-wide">In review</p>
              <p className="text-lg font-semibold text-foreground">{stats.received}</p>
              <p className="text-xs">Uploaded, pending QC against request</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xl font-bold">{stats.complete}</span>
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 text-warning-foreground" />
                <span className="text-xl font-bold">{stats.received}</span>
              </div>
              <p className="text-xs text-muted-foreground">In Review</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="text-xl font-bold">{stats.requested}</span>
              </div>
              <p className="text-xs text-muted-foreground">Requested</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <FileX className="h-4 w-4 text-muted-foreground" />
                <span className="text-xl font-bold">{stats.notRequested}</span>
              </div>
              <p className="text-xs text-muted-foreground">Not Requested</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-bold text-muted-foreground">{stats.notApplicable}</span>
              </div>
              <p className="text-xs text-muted-foreground">N/A</p>
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
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_requested">Not Requested</SelectItem>
                  <SelectItem value="requested">Pending</SelectItem>
                  <SelectItem value="received">Under review</SelectItem>
                  <SelectItem value="under_review">Under review</SelectItem>
                  <SelectItem value="complete">Approved</SelectItem>
                  <SelectItem value="not_applicable">N/A</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="required">Required</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DRL Table by Category */}
      {Object.entries(groupedItems).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No items found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {DOCUMENT_CATEGORIES[category as DocumentCategory]?.label || category}
              </CardTitle>
              <CardDescription>
                {items.filter(i => i.status === 'complete' || i.status === 'not_applicable').length} of {items.length} complete
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Document</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.documentName}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(item.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={item.status}
                          onValueChange={(value: DRLStatus) => handleStatusChange(item.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_requested">Not Requested</SelectItem>
                            <SelectItem value="requested">Pending</SelectItem>
                            <SelectItem value="received">Under review</SelectItem>
                            <SelectItem value="under_review">Under review</SelectItem>
                            <SelectItem value="complete">Approved</SelectItem>
                            <SelectItem value="not_applicable">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
