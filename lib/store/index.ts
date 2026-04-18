import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  User, Deal, Document, Extraction, Finding, DRLItem, ActivityLog,
  DealStatus, DealPhase, DocumentCategory, DocumentStatus, 
  ExtractionStatus, FindingType, FindingSeverity, FindingStatus, DRLStatus
} from '../types'
import { generateDemoData } from './demo-data'

interface AppState {
  // Auth
  currentUser: User | null
  users: User[]
  
  // Data
  deals: Deal[]
  documents: Document[]
  extractions: Extraction[]
  findings: Finding[]
  drlItems: DRLItem[]
  activityLogs: ActivityLog[]
  
  // Auth actions
  login: (email: string, password: string) => User | null
  logout: () => void
  
  // User actions
  getUser: (id: string) => User | undefined
  
  // Deal actions
  createDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Deal
  updateDeal: (id: string, updates: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  getDeal: (id: string) => Deal | undefined
  getDealsByUser: (userId: string) => Deal[]
  
  // Document actions
  addDocument: (doc: Omit<Document, 'id' | 'uploadedAt'>) => Document
  updateDocument: (id: string, updates: Partial<Document>) => void
  deleteDocument: (id: string) => void
  getDocumentsByDeal: (dealId: string) => Document[]
  
  // Extraction actions
  addExtraction: (extraction: Omit<Extraction, 'id'>) => Extraction
  updateExtraction: (id: string, updates: Partial<Extraction>) => void
  getExtractionsByDeal: (dealId: string) => Extraction[]
  getExtractionsByDocument: (documentId: string) => Extraction[]
  
  // Finding actions
  addFinding: (finding: Omit<Finding, 'id' | 'createdAt' | 'notes'>) => Finding
  updateFinding: (id: string, updates: Partial<Finding>) => void
  addNoteToFinding: (findingId: string, content: string, userId: string) => void
  getFindingsByDeal: (dealId: string) => Finding[]
  
  // DRL actions
  addDRLItem: (item: Omit<DRLItem, 'id'>) => DRLItem
  updateDRLItem: (id: string, updates: Partial<DRLItem>) => void
  getDRLByDeal: (dealId: string) => DRLItem[]
  initializeDRL: (dealId: string) => void
  
  // Activity log
  logActivity: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => void
  getActivityByDeal: (dealId: string) => ActivityLog[]
  
  // Initialize demo data
  initializeDemoData: () => void
  resetStore: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: [
        { id: 'user-1', email: 'admin@demo.com', name: 'Sarah Chen', role: 'admin', avatar: undefined },
        { id: 'user-2', email: 'analyst@demo.com', name: 'Michael Torres', role: 'analyst', avatar: undefined },
        { id: 'user-3', email: 'teamlead@demo.com', name: 'Emily Johnson', role: 'team_lead', avatar: undefined },
      ],
      deals: [],
      documents: [],
      extractions: [],
      findings: [],
      drlItems: [],
      activityLogs: [],
      
      // Auth
      login: (email, password) => {
        const user = get().users.find(u => u.email === email)
        if (user && password === 'demo123') {
          set({ currentUser: user })
          return user
        }
        return null
      },
      
      logout: () => set({ currentUser: null }),
      
      // User actions
      getUser: (id) => get().users.find(u => u.id === id),
      
      // Deal actions
      createDeal: (dealData) => {
        const deal: Deal = {
          ...dealData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set(state => ({ deals: [...state.deals, deal] }))
        get().initializeDRL(deal.id)
        return deal
      },
      
      updateDeal: (id, updates) => {
        set(state => ({
          deals: state.deals.map(d => 
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          )
        }))
      },
      
      deleteDeal: (id) => {
        set(state => ({
          deals: state.deals.filter(d => d.id !== id),
          documents: state.documents.filter(d => d.dealId !== id),
          extractions: state.extractions.filter(e => e.dealId !== id),
          findings: state.findings.filter(f => f.dealId !== id),
          drlItems: state.drlItems.filter(d => d.dealId !== id),
          activityLogs: state.activityLogs.filter(a => a.dealId !== id),
        }))
      },
      
      getDeal: (id) => get().deals.find(d => d.id === id),
      
      getDealsByUser: (userId) => {
        const user = get().getUser(userId)
        if (!user) return []
        if (user.role === 'admin') return get().deals
        if (user.role === 'analyst' || user.role === 'team_lead') {
          return get().deals.filter(d => d.assignedAnalysts.includes(userId))
        }
        return []
      },
      
      // Document actions
      addDocument: (docData) => {
        const doc: Document = {
          ...docData,
          id: generateId(),
          uploadedAt: new Date().toISOString(),
        }
        set(state => ({ documents: [...state.documents, doc] }))
        return doc
      },
      
      updateDocument: (id, updates) => {
        set(state => ({
          documents: state.documents.map(d => d.id === id ? { ...d, ...updates } : d)
        }))
      },
      
      deleteDocument: (id) => {
        set(state => ({
          documents: state.documents.filter(d => d.id !== id),
          extractions: state.extractions.filter(e => e.documentId !== id),
        }))
      },
      
      getDocumentsByDeal: (dealId) => get().documents.filter(d => d.dealId === dealId),
      
      // Extraction actions
      addExtraction: (extractionData) => {
        const extraction: Extraction = {
          ...extractionData,
          id: generateId(),
        }
        set(state => ({ extractions: [...state.extractions, extraction] }))
        return extraction
      },
      
      updateExtraction: (id, updates) => {
        set(state => ({
          extractions: state.extractions.map(e => e.id === id ? { ...e, ...updates } : e)
        }))
      },
      
      getExtractionsByDeal: (dealId) => get().extractions.filter(e => e.dealId === dealId),
      
      getExtractionsByDocument: (documentId) => get().extractions.filter(e => e.documentId === documentId),
      
      // Finding actions
      addFinding: (findingData) => {
        const finding: Finding = {
          ...findingData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          notes: [],
        }
        set(state => ({ findings: [...state.findings, finding] }))
        return finding
      },
      
      updateFinding: (id, updates) => {
        set(state => ({
          findings: state.findings.map(f => f.id === id ? { ...f, ...updates } : f)
        }))
      },
      
      addNoteToFinding: (findingId, content, userId) => {
        const note = {
          id: generateId(),
          content,
          createdBy: userId,
          createdAt: new Date().toISOString(),
        }
        set(state => ({
          findings: state.findings.map(f => 
            f.id === findingId ? { ...f, notes: [...f.notes, note] } : f
          )
        }))
      },
      
      getFindingsByDeal: (dealId) => get().findings.filter(f => f.dealId === dealId),
      
      // DRL actions
      addDRLItem: (itemData) => {
        const item: DRLItem = {
          ...itemData,
          id: generateId(),
        }
        set(state => ({ drlItems: [...state.drlItems, item] }))
        return item
      },
      
      updateDRLItem: (id, updates) => {
        set(state => ({
          drlItems: state.drlItems.map(d => d.id === id ? { ...d, ...updates } : d)
        }))
      },
      
      getDRLByDeal: (dealId) => get().drlItems.filter(d => d.dealId === dealId),
      
      initializeDRL: (dealId) => {
        const { getDRLTemplateForPracticeLine } = require('./drl-template')
        const existingItems = get().getDRLByDeal(dealId)
        if (existingItems.length > 0) return

        const deal = get().getDeal(dealId)
        const template = getDRLTemplateForPracticeLine(deal?.practiceLine)
        template.forEach((item: Omit<DRLItem, 'id' | 'dealId'>) => {
          get().addDRLItem({ ...item, dealId })
        })
      },
      
      // Activity log
      logActivity: (logData) => {
        const log: ActivityLog = {
          ...logData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set(state => ({ activityLogs: [log, ...state.activityLogs].slice(0, 500) }))
      },
      
      getActivityByDeal: (dealId) => get().activityLogs.filter(a => a.dealId === dealId),
      
      // Demo data
      initializeDemoData: () => {
        const state = get()
        if (state.deals.length === 0) {
          const demoData = generateDemoData()
          set({
            deals: demoData.deals,
            documents: demoData.documents,
            extractions: demoData.extractions,
            findings: demoData.findings,
            drlItems: demoData.drlItems,
            activityLogs: demoData.activityLogs,
          })
        }
      },
      
      resetStore: () => {
        set({
          currentUser: null,
          deals: [],
          documents: [],
          extractions: [],
          findings: [],
          drlItems: [],
          activityLogs: [],
        })
      },
    }),
    {
      name: 'hauser-dd-store-v2',
      partialize: (state) => ({
        currentUser: state.currentUser,
        deals: state.deals,
        documents: state.documents,
        extractions: state.extractions,
        findings: state.findings,
        drlItems: state.drlItems,
        activityLogs: state.activityLogs,
      }),
    }
  )
)
