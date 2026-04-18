'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { DEAL_PHASES, PRACTICE_LINES, type DealPhase, type DealStatus, type PracticeLine } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/date-utils'

export default function DealsPage() {
  const { currentUser, getDealsByUser, documents, findings, getUser, deleteDeal } = useAppStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')

  const userDeals = currentUser ? getDealsByUser(currentUser.id) : []

  const filteredDeals = userDeals.filter(deal => {
    const matchesSearch = 
      deal.name.toLowerCase().includes(search.toLowerCase()) ||
      deal.targetCompany.toLowerCase().includes(search.toLowerCase()) ||
      deal.acquirer.toLowerCase().includes(search.toLowerCase()) ||
      (deal.broker?.toLowerCase().includes(search.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
    const matchesPhase = phaseFilter === 'all' || deal.phase === phaseFilter

    return matchesSearch && matchesStatus && matchesPhase
  })

  const getPhaseColor = (phase: DealPhase) => {
    switch (phase) {
      case 'preliminary': return 'bg-muted text-muted-foreground'
      case 'due_diligence': return 'bg-primary/10 text-primary'
      case 'negotiation': return 'bg-warning/10 text-warning-foreground'
      case 'closing': return 'bg-chart-2/10 text-chart-2'
      case 'completed': return 'bg-success/10 text-success'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: DealStatus) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success'
      case 'on_hold': return 'bg-warning/10 text-warning-foreground'
      case 'completed': return 'bg-muted text-muted-foreground'
      case 'cancelled': return 'bg-destructive/10 text-destructive'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const practiceLineBadge = (line: PracticeLine | undefined) => {
    const key = line ?? 'both'
    const short = PRACTICE_LINES[key].short
    const variant =
      key === 'both' ? 'default' : key === 'pc' ? 'secondary' : 'outline'
    return (
      <Badge variant={variant} className="text-xs font-medium">
        {short === 'Both' ? 'P&C + Benefits' : short}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deals</h2>
          <p className="text-muted-foreground">
            Insurance diligence engagements assigned to your team
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Link href="/dashboard/deals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deal
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {Object.entries(DEAL_PHASES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deal Grid */}
      {filteredDeals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No deals found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search || statusFilter !== 'all' || phaseFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first deal'}
            </p>
            {currentUser?.role === 'admin' && !search && statusFilter === 'all' && phaseFilter === 'all' && (
              <Link href="/dashboard/deals/new">
                <Button>Create Deal</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => {
            const dealDocuments = documents.filter(d => d.dealId === deal.id)
            const dealFindings = findings.filter(f => f.dealId === deal.id && f.status === 'open')
            const criticalFindings = dealFindings.filter(f => f.severity === 'critical' || f.severity === 'high')
            
            return (
              <Card key={deal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <Link href={`/dashboard/deals/${deal.id}`}>
                        <CardTitle className="text-lg hover:text-primary transition-colors truncate">
                          {deal.name}
                        </CardTitle>
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">
                        {deal.targetCompany}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/deals/${deal.id}`}>
                            Open Workspace
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/deals/${deal.id}/documents`}>
                            View Documents
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/deals/${deal.id}/drl`}>
                            View DRL
                          </Link>
                        </DropdownMenuItem>
                        {currentUser?.role === 'admin' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
                                  deleteDeal(deal.id)
                                }
                              }}
                            >
                              Delete Deal
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {practiceLineBadge(deal.practiceLine)}
                    <Badge variant="secondary" className={getPhaseColor(deal.phase)}>
                      {DEAL_PHASES[deal.phase].label}
                    </Badge>
                    <Badge variant="secondary" className={getStatusColor(deal.status)}>
                      {deal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">PE buyer</p>
                      <p className="font-medium truncate">{deal.acquirer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Est. value</p>
                      <p className="font-medium">{formatCurrency(deal.dealValue)}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-muted-foreground">Industry</p>
                      <p className="font-medium">{deal.industry ?? '—'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-muted-foreground">Geography</p>
                      <p className="font-medium text-balance">{deal.geography ?? '—'}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-muted-foreground">Broker</p>
                      <p className="font-medium text-balance">{deal.broker ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">LTM revenue</p>
                      <p className="font-medium">{formatCurrency(deal.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">LTM EBITDA</p>
                      <p className="font-medium">{formatCurrency(deal.ebitda)}</p>
                    </div>
                    {(deal.specialExposures?.length ?? 0) > 0 && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-muted-foreground">Special exposures</p>
                        <p className="text-xs font-medium text-balance leading-snug">
                          {deal.specialExposures?.join(' · ')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {dealDocuments.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {deal.assignedAnalysts.length}
                      </span>
                      {criticalFindings.length > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          {criticalFindings.length}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(deal.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
