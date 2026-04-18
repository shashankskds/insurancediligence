'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { useAppStore } from '@/lib/store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { currentUser, initializeDemoData } = useAppStore()

  useEffect(() => {
    if (!currentUser) {
      router.push('/login')
    } else {
      initializeDemoData()
    }
  }, [currentUser, router, initializeDemoData])

  if (!currentUser) {
    return (
      <div
        className="flex h-screen flex-col items-center justify-center gap-3 bg-background px-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
