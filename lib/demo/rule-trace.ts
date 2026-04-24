import type { Document, Finding } from '@/lib/types'

export interface RuleTraceDemoRow {
  id: string
  firedAt: string
  ruleId: string
  framework: string
  documentName: string
  passage: string
  confidence: number
  severity: string
}

const FRAMEWORKS = ['CR P&C Review (demo)', 'EB Master Review (demo)', 'RxDC hygiene (demo)']

export function buildRuleTraceDemoRows(
  dealId: string,
  findings: Finding[],
  documents: Document[]
): RuleTraceDemoRow[] {
  const docName = (id?: string) => documents.find((d) => d.id === id)?.name ?? '—'

  const fromFindings: RuleTraceDemoRow[] = findings
    .filter((f) => f.dealId === dealId)
    .map((f, i) => ({
      id: `rt-${f.id}`,
      firedAt: f.createdAt,
      ruleId: f.ruleId ?? `synthetic-gap-${i + 1}`,
      framework: FRAMEWORKS[i % FRAMEWORKS.length],
      documentName: docName(f.documentId),
      passage: f.description.slice(0, 160) + (f.description.length > 160 ? '…' : ''),
      confidence: f.severity === 'high' || f.severity === 'critical' ? 0.88 : 0.76,
      severity: f.severity,
    }))

  if (fromFindings.length > 0) return fromFindings

  return [
    {
      id: 'rt-demo-1',
      firedAt: new Date().toISOString(),
      ruleId: 'demo-pc-limits-001',
      framework: 'CR P&C Review (demo)',
      documentName: 'Policy dec pages (placeholder)',
      passage: 'No findings yet — illustrative rule firing would appear here after gap detection runs.',
      confidence: 0.72,
      severity: 'info',
    },
  ]
}
