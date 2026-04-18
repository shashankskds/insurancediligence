'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/dashboard/deals') return 'Deals'
  if (pathname === '/dashboard/deals/new') return 'Create Deal'
  if (pathname.match(/\/dashboard\/deals\/[^/]+$/)) return 'Deal workspace'
  if (pathname.includes('/documents')) return 'Documents'
  if (pathname.includes('/extractions')) return 'Raw AI extractions'
  if (pathname.includes('/findings')) return 'Validated findings'
  if (pathname.includes('/drl')) return 'DRL tracker'
  if (pathname.includes('/report')) return 'Report'
  if (pathname === '/dashboard/admin/users') return 'User management'
  return 'Hauser'
}

export function Header() {
  const pathname = usePathname()
  const { findings, extractions } = useAppStore()
  
  // Count pending items for notifications
  const pendingExtractions = extractions.filter(e => e.status === 'pending').length
  const openFindings = findings.filter(f => f.status === 'open' && (f.severity === 'critical' || f.severity === 'high')).length
  const totalNotifications = pendingExtractions + openFindings

  return (
    <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <div className="hidden md:flex relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="global-search"
            placeholder="Search…"
            aria-label="Search deals and documents"
            className="h-9 w-52 pl-9 lg:w-64 bg-muted/40 border-transparent focus-visible:bg-background focus-visible:border-input transition-colors"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
              <Bell className="h-5 w-5 shrink-0" />
              {totalNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pendingExtractions > 0 && (
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">Extractions pending validation</span>
                <span className="text-sm text-muted-foreground">
                  {pendingExtractions} raw extraction{pendingExtractions > 1 ? 's' : ''} awaiting review
                </span>
              </DropdownMenuItem>
            )}
            {openFindings > 0 && (
              <DropdownMenuItem className="flex flex-col items-start gap-1">
                <span className="font-medium">High Priority Findings</span>
                <span className="text-sm text-muted-foreground">
                  {openFindings} critical/high severity finding{openFindings > 1 ? 's' : ''} open
                </span>
              </DropdownMenuItem>
            )}
            {totalNotifications === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                You&apos;re caught up. No pending validations or high-severity open findings across your deals.
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
