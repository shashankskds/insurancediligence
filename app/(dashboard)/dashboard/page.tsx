'use client'

import Link from 'next/link'
import { 
  FolderKanban, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ArrowRight,
  FileWarning,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { DEAL_PHASES, DOCUMENT_CATEGORIES, type DealPhase } from '@/lib/types'

export default function DashboardPage() {
  const { currentUser, deals, documents, extractions, findings, drlItems, getUser, getDealsByUser } = useAppStore()
  
  const userDeals = currentUser ? getDealsByUser(currentUser.id) : []
  const activeDeals = userDeals.filter(d => d.status === 'active')
  
  // Calculate metrics
  const totalDocuments = documents.filter(d => userDeals.some(deal => deal.id === d.dealId)).length
  const pendingExtractions = extractions.filter(e => e.status === 'pending' && userDeals.some(deal => deal.id === e.dealId)).length
  const openFindings = findings.filter(f => f.status === 'open' && userDeals.some(deal => deal.id === f.dealId))
  const criticalFindings = openFindings.filter(f => f.severity === 'critical' || f.severity === 'high')
  
  // DRL progress for active deals
  const drlProgress = activeDeals.map(deal => {
    const items = drlItems.filter(item => item.dealId === deal.id)
    const completed = items.filter(item => item.status === 'complete' || item.status === 'not_applicable').length
    return { deal, total: items.length, completed, percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0 }
  })

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const portfolioRevenue = activeDeals.reduce((s, d) => s + (d.revenue ?? 0), 0)
  const portfolioEbitda = activeDeals.reduce((s, d) => s + (d.ebitda ?? 0), 0)

  const getPhaseColor = (phase: DealPhase) => {
    switch (phase) {
      case 'preliminary': return 'bg-muted text-muted-foreground'
      case 'due_diligence': return 'bg-primary/10 text-primary'
      case 'negotiation': return 'bg-warning/10 text-warning-foreground'
      case 'closing': return 'bg-success/10 text-success'
      case 'completed': return 'bg-success text-success-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {currentUser?.name.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your diligence engagements
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deals
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeDeals.length}</div>
            <p className="text-xs text-muted-foreground">
              {userDeals.length} total deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Across all your deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingExtractions}</div>
            <p className="text-xs text-muted-foreground">
              Extractions awaiting review
            </p>
          </CardContent>
        </Card>

        <Card className={criticalFindings.length > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Findings
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${criticalFindings.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openFindings.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalFindings.length} critical/high priority
            </p>
          </CardContent>
        </Card>
      </div>

      {(portfolioRevenue > 0 || portfolioEbitda > 0) && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio rollup (active engagements)</CardTitle>
            <CardDescription className="text-xs">
              Sum of target LTM revenue / EBITDA where populated — illustrative for coverage planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-8 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Combined LTM revenue</p>
              <p className="text-xl font-semibold tabular-nums">{fmtMoney(portfolioRevenue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Combined LTM EBITDA</p>
              <p className="text-xl font-semibold tabular-nums">{fmtMoney(portfolioEbitda)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Deals */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Deals</CardTitle>
              <CardDescription>Your current deal workspaces</CardDescription>
            </div>
            <Link href="/dashboard/deals">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeDeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No active deals</p>
                {currentUser?.role === 'admin' && (
                  <Link href="/dashboard/deals/new">
                    <Button variant="outline" size="sm" className="mt-3">
                      Create a deal
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeals.slice(0, 4).map((deal) => {
                  const dealDocs = documents.filter(d => d.dealId === deal.id).length
                  const dealFindings = findings.filter(f => f.dealId === deal.id && f.status === 'open').length
                  
                  return (
                    <Link key={deal.id} href={`/dashboard/deals/${deal.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{deal.name}</p>
                            <Badge variant="secondary" className={getPhaseColor(deal.phase)}>
                              {DEAL_PHASES[deal.phase].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {deal.targetCompany}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {dealDocs}
                          </span>
                          {dealFindings > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-4 w-4" />
                              {dealFindings}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* DRL Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Document Collection Progress</CardTitle>
            <CardDescription>DRL completion by deal</CardDescription>
          </CardHeader>
          <CardContent>
            {drlProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileWarning className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No active deals to track</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drlProgress.slice(0, 4).map(({ deal, total, completed, percentage }) => (
                  <div key={deal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Link href={`/dashboard/deals/${deal.id}/drl`} className="font-medium hover:text-primary transition-colors">
                        {deal.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        {completed}/{total} items
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Findings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Priority Findings</CardTitle>
            <CardDescription>Critical and high severity findings requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {criticalFindings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-success/50 mb-3" />
                <p className="text-sm text-muted-foreground">No critical findings at this time</p>
              </div>
            ) : (
              <div className="space-y-3">
                {criticalFindings.slice(0, 5).map((finding) => {
                  const deal = userDeals.find(d => d.id === finding.dealId)
                  return (
                    <Link key={finding.id} href={`/dashboard/deals/${finding.dealId}/findings`}>
                      <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <div className={`mt-0.5 p-1.5 rounded-full ${finding.severity === 'critical' ? 'bg-destructive/10' : 'bg-destructive/5'}`}>
                          <AlertTriangle className={`h-4 w-4 ${finding.severity === 'critical' ? 'text-destructive' : 'text-destructive/70'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{finding.title}</p>
                            <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {finding.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {finding.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {deal?.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
