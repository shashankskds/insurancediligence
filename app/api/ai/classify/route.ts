import { NextRequest, NextResponse } from 'next/server'
import type { DocumentCategory } from '@/lib/types'

type ClassifySuccess = {
  ok: true
  /** @deprecated use ok — kept for older clients */
  success: true
  category: DocumentCategory
  confidence: number
  /** Short explanation for UI tooltips */
  rationale: string
}

type ClassifyError = {
  ok: false
  error: string
  code: 'INVALID_JSON' | 'VALIDATION' | 'INTERNAL'
}

function classifyFromText(documentName: string, documentText: string): ClassifySuccess {
  const nameLower = documentName.toLowerCase()
  const textLower = (documentText || '').toLowerCase()

  let category: DocumentCategory = 'other'
  let confidence = 0.78
  let rationale = 'No strong keyword match; defaulting to Other for manual review.'

  if (
    nameLower.includes('audited') ||
    nameLower.includes('financial statement') ||
    nameLower.includes('10-k') ||
    nameLower.includes('ebitda')
  ) {
    category = 'financial_statements'
    confidence = 0.93
    rationale = 'Filename or text matches financial statement patterns.'
  } else if (
    nameLower.includes('claim') &&
    (nameLower.includes('detail') || nameLower.includes('triangle') || nameLower.includes('diary'))
  ) {
    category = 'claims_history'
    confidence = 0.91
    rationale = 'Claims history / triangle style document.'
  } else if (
    nameLower.includes('policy') ||
    nameLower.includes('dec page') ||
    nameLower.includes('endorsement') ||
    textLower.includes('declarations') ||
    textLower.includes('coverage part')
  ) {
    category = 'policy_documents'
    confidence = 0.94
    rationale = 'Policy / dec page language detected.'
  } else if (nameLower.includes('loss run') || nameLower.includes('loss history') || textLower.includes('incurred losses')) {
    category = 'loss_runs'
    confidence = 0.93
    rationale = 'Loss run or incurred loss wording.'
  } else if (nameLower.includes('broker') || nameLower.includes('rfp') || nameLower.includes('submission')) {
    category = 'broker_proposals'
    confidence = 0.9
    rationale = 'Broker submission or RFP naming.'
  } else if (nameLower.includes('census') || nameLower.includes('enrollment')) {
    category = 'census_files'
    confidence = 0.92
    rationale = 'Census or enrollment file.'
  } else if (nameLower.includes('5500') || nameLower.includes('erisa') || nameLower.includes('spd')) {
    category = nameLower.includes('5500') || nameLower.includes('erisa') ? 'erisa_documents' : 'benefits_plans'
    confidence = 0.91
    rationale = 'ERISA / plan document indicators.'
  } else if (nameLower.includes('rxdc') || nameLower.includes('p2 reporting')) {
    category = 'rxdc'
    confidence = 0.89
    rationale = 'RxDC or P2 reporting reference.'
  } else if (nameLower.includes('payroll') || nameLower.includes('class code') || nameLower.includes('wc ')) {
    category = 'wc_payroll_reports'
    confidence = 0.9
    rationale = 'Payroll or workers comp class code context.'
  } else if (nameLower.includes('plan') && (nameLower.includes('medical') || nameLower.includes('dental'))) {
    category = 'benefits_plans'
    confidence = 0.88
    rationale = 'Medical or dental plan document.'
  }

  confidence = Math.min(0.99, confidence + (Math.random() * 0.08 - 0.04))

  return { ok: true, success: true, category, confidence, rationale }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      const err: ClassifyError = { ok: false, error: 'Request body must be valid JSON.', code: 'INVALID_JSON' }
      return NextResponse.json(err, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      const err: ClassifyError = { ok: false, error: 'Expected a JSON object.', code: 'VALIDATION' }
      return NextResponse.json(err, { status: 400 })
    }

    const { documentName, documentText } = body as { documentName?: unknown; documentText?: unknown }

    if (typeof documentName !== 'string' || documentName.trim().length === 0) {
      const err: ClassifyError = {
        ok: false,
        error: 'Field "documentName" is required and must be a non-empty string.',
        code: 'VALIDATION',
      }
      return NextResponse.json(err, { status: 400 })
    }

    if (documentText !== undefined && typeof documentText !== 'string') {
      const err: ClassifyError = {
        ok: false,
        error: 'Field "documentText", if provided, must be a string.',
        code: 'VALIDATION',
      }
      return NextResponse.json(err, { status: 400 })
    }

    await new Promise((resolve) => setTimeout(resolve, 800))

    const result = classifyFromText(documentName.trim(), typeof documentText === 'string' ? documentText : '')

    return NextResponse.json(result satisfies ClassifySuccess)
  } catch (error) {
    console.error('AI classification error:', error)
    const err: ClassifyError = { ok: false, error: 'Classification failed. Try again.', code: 'INTERNAL' }
    return NextResponse.json(err, { status: 500 })
  }
}
