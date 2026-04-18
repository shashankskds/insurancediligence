import { NextRequest, NextResponse } from 'next/server'

// Mock AI extraction for insurance diligence (demo)

export async function POST(req: NextRequest) {
  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Expected a JSON object.' }, { status: 400 })
    }

    const { documentId, documentText, category } = body as {
      documentId?: unknown
      documentText?: unknown
      category?: unknown
    }

    const docId = typeof documentId === 'string' ? documentId : ''
    const cat = typeof category === 'string' && category.length > 0 ? category : 'other'
    if (typeof documentText === 'string' && documentText.length > 20000) {
      return NextResponse.json({ success: false, error: 'documentText exceeds maximum length.' }, { status: 400 })
    }

    await new Promise(resolve => setTimeout(resolve, 1500))

    const extractionsByCategory: Record<
      string,
      Array<{ fieldName: string; fieldCategory: string; value: string; confidence: number; pageRef: number }>
    > = {
      policy_documents: [
        { fieldName: 'Each Occurrence limit', fieldCategory: 'P&C — GL', value: '$1,000,000', confidence: 0.94, pageRef: 2 },
        { fieldName: 'Policy period', fieldCategory: 'P&C — GL', value: '07/01/2024 – 07/01/2025', confidence: 0.96, pageRef: 1 },
        { fieldName: 'Named insured match', fieldCategory: 'P&C — Admin', value: 'Matches target legal entity', confidence: 0.88, pageRef: 1 },
      ],
      loss_runs: [
        { fieldName: '10-year loss ratio (WC)', fieldCategory: 'P&C — WC', value: '68%', confidence: 0.9, pageRef: 1 },
        { fieldName: 'Open claim count', fieldCategory: 'P&C — Claims', value: '14', confidence: 0.87, pageRef: 3 },
      ],
      claims_history: [
        { fieldName: 'Large loss count (5Y)', fieldCategory: 'P&C — Claims', value: '7', confidence: 0.89, pageRef: 2 },
        { fieldName: 'Avg closed claim cost', fieldCategory: 'P&C — Claims', value: '$42,500', confidence: 0.84, pageRef: 4 },
      ],
      financial_statements: [
        { fieldName: 'LTM Revenue', fieldCategory: 'Financial', value: '$418M', confidence: 0.92, pageRef: 3 },
        { fieldName: 'LTM EBITDA', fieldCategory: 'Financial', value: '$61M', confidence: 0.9, pageRef: 5 },
        { fieldName: 'Net debt', fieldCategory: 'Financial', value: '$112M', confidence: 0.87, pageRef: 8 },
      ],
      broker_proposals: [
        { fieldName: 'Lead markets', fieldCategory: 'Broker', value: '3 admitted, 1 E&S layer', confidence: 0.85, pageRef: 1 },
        { fieldName: 'Total estimated premium', fieldCategory: 'Broker', value: '$2.4M (all lines)', confidence: 0.82, pageRef: 2 },
      ],
      census_files: [
        { fieldName: 'Eligible employees', fieldCategory: 'Benefits — Census', value: '1,842', confidence: 0.97, pageRef: 1 },
        { fieldName: 'Funding type (medical)', fieldCategory: 'Benefits — Design', value: 'ASO / self-funded', confidence: 0.89, pageRef: 1 },
      ],
      erisa_documents: [
        { fieldName: 'Plan year end', fieldCategory: 'ERISA', value: '12/31/2024', confidence: 0.95, pageRef: 2 },
        { fieldName: 'Participant count (5500)', fieldCategory: 'ERISA', value: '1,756', confidence: 0.93, pageRef: 4 },
      ],
      benefits_plans: [
        { fieldName: 'Medical plan type', fieldCategory: 'Benefits', value: 'PPO + HDHP option', confidence: 0.9, pageRef: 6 },
        { fieldName: 'Employer HSA contribution', fieldCategory: 'Benefits', value: '$500 / year', confidence: 0.86, pageRef: 12 },
      ],
      rxdc: [
        { fieldName: 'RxDC entity count', fieldCategory: 'RxDC', value: '4 reporting entities', confidence: 0.84, pageRef: 1 },
        { fieldName: 'Submission status', fieldCategory: 'RxDC', value: 'Filed — timely', confidence: 0.82, pageRef: 3 },
      ],
      wc_payroll_reports: [
        { fieldName: 'Payroll by state (summary)', fieldCategory: 'WC', value: 'IL 42% / IN 31% / OH 27%', confidence: 0.88, pageRef: 1 },
        { fieldName: 'Experience mod (current)', fieldCategory: 'WC', value: '1.04', confidence: 0.9, pageRef: 2 },
      ],
    }

    const extractions = extractionsByCategory[cat] || [
      { fieldName: 'Summary', fieldCategory: 'General', value: 'No template for this document type', confidence: 0.72, pageRef: 1 },
    ]

    const randomizedExtractions = extractions.map(ext => ({
      ...ext,
      confidence: Math.min(0.99, ext.confidence + (Math.random() * 0.1 - 0.05)),
    }))

    return NextResponse.json({
      success: true,
      extractions: randomizedExtractions,
      documentId: docId,
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract data' },
      { status: 500 }
    )
  }
}
