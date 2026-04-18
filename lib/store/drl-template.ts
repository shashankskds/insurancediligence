import type { DRLItem, DocumentCategory, PracticeLine } from '../types'

type DRLTemplateItem = Omit<DRLItem, 'id' | 'dealId'>

/** Core insurance diligence DRL items (aligned to document taxonomy) */
const INSURANCE_DRL_CORE: DRLTemplateItem[] = [
  { category: 'financial_statements', documentName: 'Audited financial statements (3 years)', status: 'not_requested', priority: 'required' },
  { category: 'policy_documents', documentName: 'Current P&C policies (all lines)', status: 'not_requested', priority: 'required' },
  { category: 'policy_documents', documentName: 'Prior acts / tail coverage evidence', status: 'not_requested', priority: 'important' },
  { category: 'loss_runs', documentName: 'Loss runs (5–10 years, by line)', status: 'not_requested', priority: 'required' },
  { category: 'claims_history', documentName: 'Claims detail / large loss diary (5 years)', status: 'not_requested', priority: 'required' },
  { category: 'loss_runs', documentName: 'Large loss narrative / diary', status: 'not_requested', priority: 'important' },
  { category: 'broker_proposals', documentName: 'Broker market submissions & proposals', status: 'not_requested', priority: 'required' },
  { category: 'broker_proposals', documentName: 'Underwriting worksheets / SOVs', status: 'not_requested', priority: 'important' },
  { category: 'census_files', documentName: 'Active employee census (current plan year)', status: 'not_requested', priority: 'required' },
  { category: 'census_files', documentName: 'COBRA / retiree census (if applicable)', status: 'not_requested', priority: 'optional' },
  { category: 'erisa_documents', documentName: 'Form 5500 filings (3 years)', status: 'not_requested', priority: 'required' },
  { category: 'erisa_documents', documentName: 'Plan document & SPD (each plan)', status: 'not_requested', priority: 'required' },
  { category: 'benefits_plans', documentName: 'Summary of benefits / plan grid', status: 'not_requested', priority: 'required' },
  { category: 'benefits_plans', documentName: 'Stop-loss / ASO agreements', status: 'not_requested', priority: 'important' },
  { category: 'rxdc', documentName: 'RxDC submissions / P2 reporting package', status: 'not_requested', priority: 'required' },
  { category: 'wc_payroll_reports', documentName: 'WC payroll / class code allocation', status: 'not_requested', priority: 'required' },
  { category: 'wc_payroll_reports', documentName: 'Experience mod worksheets', status: 'not_requested', priority: 'important' },
  { category: 'other', documentName: 'Target letter / scope of review', status: 'not_requested', priority: 'optional' },
]

const filterByPracticeLine = (line: PracticeLine): DRLTemplateItem[] => {
  const pcCats: DocumentCategory[] = [
    'financial_statements',
    'policy_documents',
    'loss_runs',
    'claims_history',
    'broker_proposals',
    'wc_payroll_reports',
    'other',
  ]
  const benCats: DocumentCategory[] = [
    'financial_statements',
    'census_files',
    'erisa_documents',
    'benefits_plans',
    'rxdc',
    'broker_proposals',
    'other',
  ]
  const allow =
    line === 'both'
      ? null
      : line === 'pc'
        ? new Set(pcCats)
        : new Set(benCats)
  if (!allow) return [...INSURANCE_DRL_CORE]
  return INSURANCE_DRL_CORE.filter((row) => allow.has(row.category))
}

export function getDRLTemplateForPracticeLine(line: PracticeLine | undefined): DRLTemplateItem[] {
  return filterByPracticeLine(line ?? 'both')
}

/** @deprecated use getDRLTemplateForPracticeLine */
export const DRL_TEMPLATE: DRLTemplateItem[] = filterByPracticeLine('both')
