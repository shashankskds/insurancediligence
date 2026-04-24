'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Radar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { buildRuleTraceDemoRows } from '@/lib/demo/rule-trace'
import { formatDate } from '@/lib/date-utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function RulesTracePage({ params }: PageProps) {
  const { id: dealId } = use(params)
  const { getDeal, getFindingsByDeal, getDocumentsByDeal } = useAppStore()
  const deal = getDeal(dealId)
  const findings = getFindingsByDeal(dealId)
  const documents = getDocumentsByDeal(dealId)
  const rows = buildRuleTraceDemoRows(dealId, findings, documents)

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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Rule firing trace</h2>
            <Badge variant="outline">E8 demo</Badge>
          </div>
          <p className="text-muted-foreground">{deal.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Deterministic rule events (illustrative)
          </CardTitle>
          <CardDescription>
            Deck epic E8: rule ID, framework, document, passage excerpt, confidence, severity. Rows below are
            derived from current findings for this deal, plus a placeholder when none exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fired</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Passage</TableHead>
                <TableHead className="text-right">Conf.</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(r.firedAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.ruleId}</TableCell>
                  <TableCell className="text-xs max-w-[140px]">{r.framework}</TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate">{r.documentName}</TableCell>
                  <TableCell className="text-xs max-w-[220px]">{r.passage}</TableCell>
                  <TableCell className="text-right text-xs">{Math.round(r.confidence * 100)}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {r.severity}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
