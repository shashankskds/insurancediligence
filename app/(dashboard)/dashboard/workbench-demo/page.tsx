'use client'

import Link from 'next/link'
import {
  Sparkles,
  Target,
  Shield,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  Circle,
  Upload,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

export default function WorkbenchDemoPage() {
  const { currentUser, getDealsByUser } = useAppStore()
  const deals = currentUser ? getDealsByUser(currentUser.id) : []

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-6 w-6 text-primary" />
          <Badge variant="secondary">Demo</Badge>
        </div>
        <h2 className="text-2xl font-bold">AI diligence workbench</h2>
        <p className="text-muted-foreground max-w-2xl">
          In-app demo hub: value checkpoints, benchmark stubs, rule trace, uploads, and exports. Open any deal for
          per-engagement pages.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Value checkpoints
            </CardTitle>
            <CardDescription>Illustrative rollout gates for walkthroughs — not tied to live metrics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Gate 1 — Research reduction (~week 8)</p>
                <p className="text-muted-foreground text-xs">
                  Workspace, upload, DRL population, P&amp;C extraction with citations, analyst accept/edit/reject.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Gate 2 — Draft report (~week 12)</p>
                <p className="text-muted-foreground text-xs">
                  Benefits rules, benchmarking, draft summary from validated findings, shadow comparison.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Benchmarks (EB demo)
            </CardTitle>
            <CardDescription>Placeholder labels for external benchmarks — not live feeds.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Mercer 2024 (stub)</Badge>
            <Badge variant="outline">KFF 2024 (stub)</Badge>
            <Badge variant="outline">CMS actuarial value (stub)</Badge>
            <Badge variant="outline">PEPY / PEPM vs peers (stub)</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exports
            </CardTitle>
            <CardDescription>DRL Excel and report DOCX/XLSX are wired from deal pages (demo files).</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Use <strong>DRL tracker → Export Excel</strong> and <strong>Summary report → exports</strong> on a deal.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/deals">Go to deals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload intake
            </CardTitle>
            <CardDescription>
              Every deal has an <strong>on-page upload card</strong> (drag / choose files / format shortcuts) plus an
              optional <strong>floating window</strong>. Deep-link: <code className="text-xs">?upload=1</code> or{' '}
              <code className="text-xs">#upload</code> on the documents route.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {deals[0] ? (
              <>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/deals/${deals[0].id}/documents#upload`}>
                    Upload panel — {deals[0].name}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/deals/${deals[0].id}/documents?upload=1`}>+ open window</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Create or load a deal to try uploads.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deals — rule trace or First 100 days</CardTitle>
          <CardDescription>Per-deal demo pages for traceability and post-close planning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sign in and load demo data from the login screen.</p>
          ) : (
            deals.slice(0, 8).map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.targetCompany}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/deals/${d.id}/rules-trace`}>
                      Rule trace
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/deals/${d.id}/first-100-days`}>First 100 days</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/deals/${d.id}`}>Workspace</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
