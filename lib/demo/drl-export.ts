import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { DRLItem } from '@/lib/types'

function safeFilename(name: string) {
  return name.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').slice(0, 80) || 'deal'
}

export function downloadDrlAsXlsx(dealName: string, items: DRLItem[]) {
  const rows = items.map((i) => ({
    Category: i.category,
    Document: i.documentName,
    Priority: i.priority,
    Status: i.status,
    LinkedDocumentId: i.documentId ?? '',
    RequestedAt: i.requestedAt ?? '',
    ReceivedAt: i.receivedAt ?? '',
    Notes: i.notes ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'DRL')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  saveAs(blob, `${safeFilename(dealName)}-DRL.xlsx`)
}
