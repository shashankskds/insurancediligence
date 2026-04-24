'use client'

import { use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Brain,
  AlertTriangle,
  ClipboardList,
  FileOutput,
  Calendar,
  CalendarRange,
  Radar,
  Building2,
  DollarSign,
  Users,
  Upload,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { DEAL_PHASES, PRACTICE_LINES, USER_ROLE_LABELS, type DealPhase, type PracticeLine } from '@/lib/types'
import { formatDate } from '@/lib/date-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

type WorkspaceNavLink = {
  href: string
  label: string
  icon: LucideIcon
  description: string
  count?: number | string
  highlight?: boolean
}

export default function DealWorkspacePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { 
    getDeal, 
    getDocumentsByDeal, 
    getExtractionsByDeal, 
    getFindingsByDeal, 
    getDRLByDeal,
    getUser,
    currentUser,
    deleteDeal
  } = useAppStore()

  const deal = getDeal(id)
  const documents = getDocumentsByDeal(id)
  const extractions = getExtractionsByDeal(id)
  const findings = getFindingsByDeal(id)
  const drlItems = getDRLByDeal(id)

  if (!deal) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium mb-2">Deal Not Found</h3>
          <p className="text-muted-foreground mb-4">This deal does not exist or you don&apos;t have access.</p>
          <Link href="/dashboard/deals">
            <Button variant="outline">Back to Deals</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const pendingExtractions = extractions.filter(e => e.status === 'pending').length
  const acceptedExtractions = extractions.filter(e => e.status === 'accepted').length
  const openFindings = findings.filter(f => f.status === 'open').length
  const criticalFindings = findings.filter(f => f.status === 'open' && (f.severity === 'critical' || f.severity === 'high')).length
  
  const drlCompleted = drlItems.filter(d => d.status === 'complete' || d.status === 'not_applicable').length
  const drlProgress = drlItems.length > 0 ? Math.round((drlCompleted / drlItems.length) * 100) : 0
  const practiceLine: PracticeLine = deal.practiceLine ?? 'both'
  const pl = PRACTICE_LINES[practiceLine]

  const extractionBlurb =
    practiceLine === 'benefits'
      ? 'Raw fields from census, SPD, 5500, and RxDC packages'
      : practiceLine === 'pc'
        ? 'Raw fields from policies, loss runs, broker SOVs, and payroll'
        : 'Raw fields across P&C and benefits files pending validation'

  const findingsBlurb =
    practiceLine === 'benefits'
      ? 'Reviewer-validated issues, gaps, and observations for benefits diligence'
      : practiceLine === 'pc'
        ? 'Reviewer-validated issues for liability, WC, and program structure'
        : 'Reviewer-validated diligence issues tied to source documents'

  const workspaceLinkDefs: WorkspaceNavLink[] = [
    { href: `/dashboard/deals/${id}/documents`, label: 'Documents', icon: FileText, count: documents.length, description: 'Intake, PHI tags, and insurance taxonomy' },
    { href: `/dashboard/deals/${id}/extractions`, label: 'Raw AI extractions', icon: Brain, count: pendingExtractions, highlight: pendingExtractions > 0, description: extractionBlurb },
    { href: `/dashboard/deals/${id}/findings`, label: 'Validated findings', icon: AlertTriangle, count: openFindings, highlight: criticalFindings > 0, description: findingsBlurb },
    { href: `/dashboard/deals/${id}/drl`, label: 'DRL tracker', icon: ClipboardList, count: `${drlProgress}%`, description: 'Requested vs received vs complete (DRL completion)' },
    { href: `/dashboard/deals/${id}/first-100-days`, label: 'First 100 days', icon: CalendarRange, description: 'Post-close action plan outline (demo)' },
    { href: `/dashboard/deals/${id}/rules-trace`, label: 'Rule trace', icon: Radar, description: 'Rule-firing log aligned to deck E8 (demo)' },
    { href: `/dashboard/deals/${id}/report`, label: 'Report', icon: FileOutput, description: 'Team Lead approval, versions, and audit export' },
  ]
  const tail = ['/first-100-days', '/rules-trace', '/report'] as const
  const order =
    practiceLine === 'pc'
      ? ['/documents', '/drl', '/extractions', '/findings', ...tail]
      : practiceLine === 'benefits'
        ? ['/documents', '/extractions', '/findings', '/drl', ...tail]
        : ['/documents', '/extractions', '/findings', '/drl', ...tail]
  const workspaceLinks = order.map((suffix) => {
    const found = workspaceLinkDefs.find((l) => l.href.endsWith(suffix))
    return found!
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

  const formatCurrency = (value?: number) => {
    if (!value) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/deals">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold">{deal.name}</h2>
              <Badge variant="outline" className="font-medium">
                {pl.short === 'Both' ? 'Practice lines: P&C + Benefits' : `Practice line: ${pl.label}`}
              </Badge>
              <Badge variant="secondary" className={getPhaseColor(deal.phase)}>
                {DEAL_PHASES[deal.phase].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">{deal.targetCompany}</p>
            {(deal.industry || deal.geography) && (
              <p className="text-sm text-muted-foreground mt-1">
                {[deal.industry, deal.geography].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        
        {currentUser?.role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Deal</DropdownMenuItem>
              <DropdownMenuItem>Change Phase</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this deal?')) {
                    deleteDeal(id)
                    router.push('/dashboard/deals')
                  }
                }}
              >
                Delete Deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Deal Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">PE buyer</p>
                <p className="font-medium">{deal.acquirer}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deal Value</p>
                <p className="font-medium">{formatCurrency(deal.dealValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(deal.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {deal.assignedAnalysts.slice(0, 4).map((analystId) => {
                    const analyst = getUser(analystId)
                    return analyst ? (
                      <div key={analystId} className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 border border-border shrink-0">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {getInitials(analyst.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-[7rem]">{analyst.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{USER_ROLE_LABELS[analyst.role]}</p>
                        </div>
                      </div>
                    ) : null
                  })}
                  {deal.assignedAnalysts.length > 4 && (
                    <div className="text-xs text-muted-foreground self-center">
                      +{deal.assignedAnalysts.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Broker & target metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Broker</p>
            <p className="font-medium">{deal.broker ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">LTM revenue</p>
            <p className="font-medium">{formatCurrency(deal.revenue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">LTM EBITDA</p>
            <p className="font-medium">{formatCurrency(deal.ebitda)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {deal.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{deal.description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/15 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Document intake
          </CardTitle>
          <CardDescription>
            Add diligence files from your machine (VDR download → upload). On-page drop zone or floating window.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/dashboard/deals/${id}/documents#upload`}>Open upload panel</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/deals/${id}/documents?upload=1`}>Upload + open window</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/dashboard/deals/${id}/documents`}>All documents</Link>
          </Button>
        </CardContent>
      </Card>

      {/* DRL completion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">DRL completion</CardTitle>
            <span className="text-sm text-muted-foreground">
              {drlCompleted} of {drlItems.length} satisfied · {drlProgress}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={drlProgress} className="h-2" />
        </CardContent>
      </Card>

      {(currentUser?.role === 'team_lead' || currentUser?.role === 'admin') && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Lead review queue</CardTitle>
            <CardDescription>
              Workflow visibility for this engagement (demo). Approvals gate client-facing exports on the Report tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>· 1 diligence summary pending Team Lead sign-off</p>
            <p>· PHI census file flagged — confirm restricted handling before external share</p>
          </CardContent>
        </Card>
      )}

      {/* Workspace Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaceLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${link.highlight ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <link.icon className={`h-5 w-5 ${link.highlight ? 'text-destructive' : 'text-muted-foreground'}`} />
                  </div>
                  {link.count !== undefined && (
                    <Badge variant={link.highlight ? 'destructive' : 'secondary'}>
                      {link.count}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{link.label}</h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Raw extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extractions.length}</div>
            <p className="text-xs text-muted-foreground">
              {acceptedExtractions} approved, {pendingExtractions} pending
            </p>
          </CardContent>
        </Card>
        <Card className={criticalFindings > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open validated findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openFindings}</div>
            <p className="text-xs text-muted-foreground">
              {criticalFindings} critical/high priority
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diligence doc types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              {new Set(documents.map(d => d.category)).size} insurance categories in room
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
