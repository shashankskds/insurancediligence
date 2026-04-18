// Core data types — Hauser insurance diligence workspace

export type UserRole = 'admin' | 'analyst' | 'team_lead'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export type DealPhase = 'preliminary' | 'due_diligence' | 'negotiation' | 'closing' | 'completed'
export type DealStatus = 'active' | 'on_hold' | 'completed' | 'cancelled'

/** Lines of business under review for the engagement */
export type PracticeLine = 'pc' | 'benefits' | 'both'

export interface Deal {
  id: string
  name: string
  targetCompany: string
  /** Private equity buyer / sponsor */
  acquirer: string
  status: DealStatus
  phase: DealPhase
  description?: string
  dealValue?: number
  /** Primary retail broker / wholesale broker on the program */
  broker?: string
  /** LTM revenue (target), if in scope */
  revenue?: number
  /** LTM EBITDA (target), if in scope */
  ebitda?: number
  createdAt: string
  updatedAt: string
  assignedAnalysts: string[]
  createdBy: string
  practiceLine?: PracticeLine
  industry?: string
  geography?: string
  specialExposures?: string[]
}

/** Insurance diligence document taxonomy */
export type DocumentCategory =
  | 'policy_documents'
  | 'loss_runs'
  | 'claims_history'
  | 'broker_proposals'
  | 'census_files'
  | 'erisa_documents'
  | 'benefits_plans'
  | 'rxdc'
  | 'wc_payroll_reports'
  | 'financial_statements'
  | 'other'

export type DocumentStatus = 'uploading' | 'processing' | 'ocr_pending' | 'ocr_processing' | 'ready' | 'error'

/** PHI handling flag for intake and routing */
export type PhiSensitivity = 'phi' | 'non_phi'

export interface Document {
  id: string
  dealId: string
  name: string
  type: 'pdf' | 'docx' | 'doc' | 'xlsx' | 'xls' | 'eml'
  category: DocumentCategory
  status: DocumentStatus
  uploadedAt: string
  uploadedBy: string
  blobUrl: string
  fileSize: number
  pageCount?: number
  ocrProcessed: boolean
  extractedText?: string
  classificationConfidence?: number
  phiSensitivity?: PhiSensitivity
  /** When this row was created from an email package extraction */
  extractedFromDocumentId?: string
}

export type ExtractionStatus = 'pending' | 'accepted' | 'rejected' | 'edited'

export interface Extraction {
  id: string
  documentId: string
  dealId: string
  fieldName: string
  fieldCategory: string
  value: string
  originalValue: string
  confidence: number
  pageRef: number
  sourceText?: string
  status: ExtractionStatus
  reviewedBy?: string
  reviewedAt?: string
  editReason?: string
}

export type FindingType = 'risk' | 'gap' | 'alert' | 'observation'
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type FindingStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'

/** Sponsor / Team Lead review gate for a finding (separate from resolution) */
export type FindingReviewWorkflow =
  | 'under_review'
  | 'approved'
  | 'needs_changes'
  | 'pending_docs'
  | 'blocked'

export interface FindingNote {
  id: string
  content: string
  createdBy: string
  createdAt: string
}

export interface Finding {
  id: string
  dealId: string
  documentId?: string
  /** When this finding was promoted from a reviewed extraction */
  sourceExtractionId?: string
  type: FindingType
  severity: FindingSeverity
  status: FindingStatus
  /** Reviewer responsible for disposition */
  assignedTo?: string
  /** Client / internal approval workflow */
  reviewWorkflow?: FindingReviewWorkflow
  title: string
  description: string
  pageRef?: number
  ruleId?: string
  notes: FindingNote[]
  createdAt: string
  createdBy: string
  resolvedAt?: string
  resolvedBy?: string
}

export type DRLStatus = 'not_requested' | 'requested' | 'received' | 'under_review' | 'complete' | 'not_applicable'

export interface DRLItem {
  id: string
  dealId: string
  category: DocumentCategory
  documentName: string
  description?: string
  status: DRLStatus
  priority: 'required' | 'important' | 'optional'
  assignee?: string
  requestedAt?: string
  receivedAt?: string
  documentId?: string
  notes?: string
}

export interface ActivityLog {
  id: string
  dealId: string
  userId: string
  action: string
  details: string
  entityType: 'deal' | 'document' | 'extraction' | 'finding' | 'drl'
  entityId: string
  createdAt: string
}

export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; description: string }> = {
  policy_documents: { label: 'Policy documents', description: 'Dec pages, schedules, endorsements' },
  loss_runs: { label: 'Loss runs', description: 'Historical claims and loss development' },
  claims_history: { label: 'Claims history', description: 'Claim detail, triangles, large loss' },
  broker_proposals: { label: 'Broker submissions', description: 'Market submissions, RFPs, quotes' },
  census_files: { label: 'Census files', description: 'Enrollment and demographic inputs' },
  erisa_documents: { label: 'ERISA documents', description: 'Plan documents, SPDs, Form 5500' },
  benefits_plans: { label: 'Benefits plans', description: 'Medical, dental, life, disability' },
  rxdc: { label: 'RxDC', description: 'Prescription drug data collection filings' },
  wc_payroll_reports: { label: 'WC payroll reports', description: 'State class codes, payroll by jurisdiction' },
  financial_statements: { label: 'Financial statements', description: 'Audited / interim financials, EBITDA bridge' },
  other: { label: 'Other', description: 'Miscellaneous diligence files' },
}

/** Below this model confidence, extractions are flagged for mandatory human validation */
export const EXTRACTION_UNCERTAINTY_THRESHOLD = 0.85

export const FINDING_REVIEW_LABELS: Record<FindingReviewWorkflow, string> = {
  under_review: 'Under review',
  approved: 'Approved',
  needs_changes: 'Needs changes',
  pending_docs: 'Pending docs',
  blocked: 'Blocked',
}

export const PRACTICE_LINES: Record<PracticeLine, { label: string; short: string }> = {
  pc: { label: 'Property & Casualty', short: 'P&C' },
  benefits: { label: 'Employee Benefits', short: 'Benefits' },
  both: { label: 'P&C and Benefits', short: 'Both' },
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  analyst: 'Analyst',
  team_lead: 'Team Lead',
}

export const DEAL_PHASES: Record<DealPhase, { label: string; order: number }> = {
  preliminary: { label: 'Preliminary', order: 1 },
  due_diligence: { label: 'Due Diligence', order: 2 },
  negotiation: { label: 'Negotiation', order: 3 },
  closing: { label: 'Closing', order: 4 },
  completed: { label: 'Completed', order: 5 },
}

export const FINDING_SEVERITIES: Record<FindingSeverity, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'destructive' },
  high: { label: 'High', color: 'destructive' },
  medium: { label: 'Medium', color: 'warning' },
  low: { label: 'Low', color: 'secondary' },
  info: { label: 'Info', color: 'muted' },
}

/** Workflow-facing labels for extraction review states */
export const EXTRACTION_STATUS_LABELS: Record<ExtractionStatus, string> = {
  pending: 'Pending',
  accepted: 'Approved',
  rejected: 'Needs changes',
  edited: 'Approved',
}
