'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarRange, CheckCircle2, CircleDot } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

interface PageProps {
  params: Promise<{ id: string }>
}

const PHASES = [
  {
    title: 'Days 1–30 — Stabilize coverage & notices',
    items: [
      'Confirm named insureds and additional insureds post-close',
      'Align broker-of-record letters and policy inception dates',
      'Benefits: COBRA / CHIPRA notices and enrollment cutoff dates',
      'RxDC / ACA reporting calendar for first plan year under sponsor',
    ],
  },
  {
    title: 'Days 31–60 — Integrate programs & data',
    items: [
      'Merge loss control recommendations from diligence into safety plan',
      'WC: jurisdiction payroll mapping and mod worksheets into payroll vendor',
      'Stop-loss / ASO: carrier interfaces and banking for claims fund',
      'Establish PHI handling lane for ongoing census updates',
    ],
  },
  {
    title: 'Days 61–100 — Operating rhythm',
    items: [
      'Quarterly broker stewardship with KPI dashboard',
      'Renewal strategy workshop with sponsor finance',
      'Run first post-close exposure benchmark vs Mercer / KFF baselines (demo)',
      'Archive diligence artifacts per retention policy',
    ],
  },
]

export default function First100DaysPage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { getDeal, demoTrainingMode } = useAppStore()
  const deal = getDeal(dealId)

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
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/deals/${dealId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold">First 100 days</h2>
            <Badge variant="outline">Demo plan</Badge>
            {demoTrainingMode && (
              <Badge variant="secondary" className="gap-1">
                <CircleDot className="h-3 w-3" />
                Training mode
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{deal.name} · {deal.targetCompany}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            Layer 5 placeholder (deck)
          </CardTitle>
          <CardDescription>
            Production would generate a draft action plan from <strong>analyst-validated</strong> findings only.
            This page is a structured outline for demos and workshops.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PHASES.map((phase) => (
          <Card key={phase.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm leading-snug">{phase.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {phase.items.map((item) => (
                <div key={item} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
