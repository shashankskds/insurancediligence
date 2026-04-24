'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  FileOutput, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle2,
  ClipboardList,
  Building2,
  Loader2,
  History,
  ShieldCheck,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { DEAL_PHASES, DOCUMENT_CATEGORIES, type DealPhase } from '@/lib/types'
import { formatDate } from '@/lib/date-utils'
import { toast } from 'sonner'
import { downloadDealSummaryDocx, downloadDealSummaryXlsx } from '@/lib/demo/report-export'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ReportPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { 
    getDeal, 
    getDocumentsByDeal, 
    getExtractionsByDeal, 
    getFindingsByDeal, 
    getDRLByDeal,
    currentUser,
    getActivityByDeal,
    logActivity,
  } = useAppStore()
  
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'xlsx' | 'pptx' | null>(null)
  const [reportApproved, setReportApproved] = useState(false)

  const deal = getDeal(dealId)
  const documents = getDocumentsByDeal(dealId)
  const extractions = getExtractionsByDeal(dealId)
  const findings = getFindingsByDeal(dealId)
  const drlItems = getDRLByDeal(dealId)

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

  // Calculate metrics
  const acceptedExtractions = extractions.filter(e => e.status === 'accepted' || e.status === 'edited')
  const openFindings = findings.filter(f => f.status === 'open')
  const criticalFindings = openFindings.filter(f => f.severity === 'critical' || f.severity === 'high')
  const drlComplete = drlItems.filter(i => i.status === 'complete' || i.status === 'not_applicable').length
  const drlProgress = drlItems.length > 0 ? Math.round((drlComplete / drlItems.length) * 100) : 0

  // Group findings by severity
  const findingsBySeverity = findings.reduce((acc, f) => {
    if (!acc[f.severity]) acc[f.severity] = []
    acc[f.severity].push(f)
    return acc
  }, {} as Record<string, typeof findings>)

  // Group extractions by category
  const extractionsByCategory = acceptedExtractions.reduce((acc, e) => {
    if (!acc[e.fieldCategory]) acc[e.fieldCategory] = []
    acc[e.fieldCategory].push(e)
    return acc
  }, {} as Record<string, typeof extractions>)

  const handleExport = async (format: 'pdf' | 'docx' | 'xlsx' | 'pptx') => {
    if (!reportApproved) {
      toast.error('Approval required', {
        description: 'Use “Approve for export” below before downloading client-ready files.',
      })
      return
    }
    setExporting(format)
    try {
      if (format === 'docx') {
        await downloadDealSummaryDocx({ deal, findings, extractions })
        toast.success('DOCX downloaded', { description: 'Summary built from current deal data (demo).' })
        if (currentUser) {
          logActivity({
            dealId,
            userId: currentUser.id,
            action: 'exported',
            details: 'Downloaded diligence summary DOCX',
            entityType: 'deal',
            entityId: dealId,
          })
        }
      } else if (format === 'xlsx') {
        downloadDealSummaryXlsx({ deal, findings, extractions })
        toast.success('Excel downloaded', { description: 'Summary, findings, and extractions sheets (demo).' })
        if (currentUser) {
          logActivity({
            dealId,
            userId: currentUser.id,
            action: 'exported',
            details: 'Downloaded diligence summary Excel',
            entityType: 'deal',
            entityId: dealId,
          })
        }
      } else if (format === 'pdf') {
        toast.message('PDF not generated in demo', {
          description: 'Use DOCX or Excel for a real download in this build.',
        })
      } else {
        toast.message('PowerPoint not generated in demo', {
          description: 'Presentation export is not wired in this build.',
        })
      }
    } catch {
      toast.error('Export failed', { description: 'Try again or use a different format.' })
    } finally {
      setExporting(null)
    }
  }

  const handleAuditExport = () => {
    const logs = getActivityByDeal(dealId).slice(0, 50)
    const preview = logs
      .slice(0, 6)
      .map((l) => `${l.action}: ${l.details.slice(0, 48)}${l.details.length > 48 ? '…' : ''}`)
      .join('\n')
    toast.message('Audit log preview', {
      description:
        logs.length === 0
          ? 'No activity recorded for this deal yet.'
          : `${logs.length} events (showing 6).\n${preview}${logs.length > 6 ? '\n…' : ''}`,
      duration: 9000,
    })
  }

  const canApproveReport = currentUser?.role === 'team_lead' || currentUser?.role === 'admin'

  const versionHistory = [
    { version: '0.3', when: '2026-04-12', note: 'DRL refresh; findings re-tiered' },
    { version: '0.2', when: '2026-04-02', note: 'Added RxDC package; census PHI flag' },
    { version: '0.1', when: '2026-03-18', note: 'Initial skeleton from template' },
  ]

  const formatCurrency = (value?: number) => {
    if (!value) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

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
            <h2 className="text-2xl font-bold">Summary Report</h2>
            <p className="text-muted-foreground">{deal.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" className="gap-2" onClick={handleAuditExport}>
            <History className="h-4 w-4" />
            Export audit log
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => handleExport('docx')}
            disabled={!!exporting || !reportApproved}
          >
            {exporting === 'docx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Export DOCX
          </Button>
          <Button 
            className="gap-2"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting || !reportApproved}
          >
            {exporting === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleExport('xlsx')}
            disabled={!!exporting || !reportApproved}
          >
            {exporting === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleExport('pptx')}
            disabled={!!exporting || !reportApproved}
          >
            {exporting === 'pptx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Presentation className="h-4 w-4" />
            )}
            Export PowerPoint
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Export approval gate
            </CardTitle>
            <CardDescription>
              Client-ready exports require Team Lead or Admin sign-off (demo control).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Badge variant={reportApproved ? 'default' : 'secondary'} className="w-fit">
              {reportApproved ? 'Approved for export' : 'Pending approval'}
            </Badge>
            {canApproveReport ? (
              <Button size="sm" variant={reportApproved ? 'outline' : 'default'} onClick={() => setReportApproved(!reportApproved)}>
                {reportApproved ? 'Revoke approval' : 'Approve for export'}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Sign in as Team Lead or Admin to toggle approval.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Report version history
            </CardTitle>
            <CardDescription>Immutable snapshots for audit (illustrative).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {versionHistory.map((v) => (
              <div key={v.version} className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
                <span className="font-medium">v{v.version}</span>
                <span className="text-muted-foreground shrink-0">{v.when}</span>
                <span className="text-muted-foreground text-right flex-1 min-w-0">{v.note}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      <Card className="overflow-hidden">
        <div className="bg-sidebar p-8 text-sidebar-foreground">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sidebar-primary">
              <Building2 className="h-7 w-7 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Insurance diligence summary</h1>
              <p className="text-sidebar-foreground/70">{deal.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-sidebar-foreground/60">Target Company</p>
              <p className="font-semibold">{deal.targetCompany}</p>
            </div>
            <div>
              <p className="text-sm text-sidebar-foreground/60">PE buyer</p>
              <p className="font-semibold">{deal.acquirer}</p>
            </div>
            <div>
              <p className="text-sm text-sidebar-foreground/60">Deal Value</p>
              <p className="font-semibold">{formatCurrency(deal.dealValue)}</p>
            </div>
            <div>
              <p className="text-sm text-sidebar-foreground/60">Phase</p>
              <Badge variant="secondary" className={`mt-1 ${getPhaseColor(deal.phase)}`}>
                {DEAL_PHASES[deal.phase].label}
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="p-8 space-y-8">
          {/* Executive Summary */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileOutput className="h-5 w-5 text-primary" />
              Executive Summary
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{documents.length}</div>
                  <p className="text-sm text-muted-foreground">Documents Reviewed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{acceptedExtractions.length}</div>
                  <p className="text-sm text-muted-foreground">Data Points Extracted</p>
                </CardContent>
              </Card>
              <Card className={criticalFindings.length > 0 ? 'border-destructive/50' : ''}>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold text-destructive">{openFindings.length}</div>
                  <p className="text-sm text-muted-foreground">Open Findings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{drlProgress}%</div>
                  <p className="text-sm text-muted-foreground">DRL completion</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Key Findings */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Key Findings ({openFindings.length} Open)
            </h2>
            {openFindings.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                  <p className="text-muted-foreground">No open findings at this time</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {['critical', 'high', 'medium', 'low', 'info'].map(severity => {
                  const items = findingsBySeverity[severity] || []
                  const openItems = items.filter(f => f.status === 'open')
                  if (openItems.length === 0) return null
                  
                  return (
                    <div key={severity}>
                      <h3 className="text-sm font-medium capitalize mb-2 text-muted-foreground">
                        {severity} ({openItems.length})
                      </h3>
                      <div className="space-y-2">
                        {openItems.map(finding => (
                          <Card key={finding.id} className={severity === 'critical' || severity === 'high' ? 'border-destructive/30' : ''}>
                            <CardContent className="py-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{finding.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {finding.description}
                                  </p>
                                </div>
                                <Badge variant={severity === 'critical' || severity === 'high' ? 'destructive' : 'secondary'}>
                                  {severity}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <Separator />

          {/* Extracted Data Summary */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Approved extractions ({acceptedExtractions.length})
            </h2>
            {Object.entries(extractionsByCategory).length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center">
                  <p className="text-muted-foreground">No verified extractions yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(extractionsByCategory).map(([category, items]) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {items.slice(0, 5).map(ext => (
                          <div key={ext.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{ext.fieldName}</span>
                            <span className="font-medium">{ext.value}</span>
                          </div>
                        ))}
                        {items.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{items.length - 5} more
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Document Status */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              DRL completion by document type
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => {
                const categoryItems = drlItems.filter(i => i.category === key)
                if (categoryItems.length === 0) return null
                const complete = categoryItems.filter(i => i.status === 'complete' || i.status === 'not_applicable').length
                const percentage = Math.round((complete / categoryItems.length) * 100)
                
                return (
                  <Card key={key}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {complete} of {categoryItems.length} items
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          <Separator />

          {/* Report Footer */}
          <section className="text-center text-sm text-muted-foreground pt-4">
            <p>Report generated on {formatDate(new Date().toISOString())}</p>
            <p>Hauser — confidential work product</p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
