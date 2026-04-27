'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'
import { USER_ROLE_LABELS } from '@/lib/types'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LoginPage() {
  const router = useRouter()
  const { login, initializeDemoData } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const user = login(email, password)
    if (user) {
      initializeDemoData()
      toast.success('Signed in', { description: `Welcome back, ${user.name.split(' ')[0]}.` })
      router.push('/dashboard')
    } else {
      const msg = 'Invalid email or password. Use a demo account below or correct credentials.'
      setError(msg)
      toast.error('Could not sign in', { description: msg })
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('demo123')
    setError('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const user = login(demoEmail, 'demo123')
    if (user) {
      initializeDemoData()
      toast.success('Signed in', { description: `${USER_ROLE_LABELS[user.role]} session started.` })
      router.push('/dashboard')
    } else {
      toast.error('Demo sign-in failed', { description: 'Check that demo accounts are configured.' })
      setIsLoading(false)
    }
  }

  const demoAccounts: { email: string; name: string; roleKey: keyof typeof USER_ROLE_LABELS }[] = [
    { email: 'analyst@demo.com', name: 'Michael Torres', roleKey: 'analyst' },
    { email: 'teamlead@demo.com', name: 'Emily Johnson', roleKey: 'team_lead' },
    { email: 'admin@demo.com', name: 'Sarah Chen', roleKey: 'admin' },
  ]

  return (
    <div className="relative min-h-screen flex">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle className="bg-background/80 shadow-sm backdrop-blur-sm border border-border" />
      </div>
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12 border-r border-sidebar-border">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sidebar-primary">
              <Building2 className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">Hauser</span>
              <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest">M&A Insurance Due Diligence</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-lg">
          <h1 className="text-3xl font-semibold leading-tight text-balance">
            Private diligence workspace
          </h1>
          <p className="text-sm text-sidebar-foreground/75 leading-relaxed">
            Document intake, DRL tracking, AI-assisted extraction, and reviewer workflows for M&A insurance due
            diligence. Authorized Hauser personnel only.
          </p>
          <ul className="text-sm text-sidebar-foreground/70 space-y-2 list-disc pl-5">
            <li>Role-based access aligned to your engagement</li>
            <li>PHI-aware document handling and audit-friendly exports</li>
            <li>Integrated request list and validation against sponsor materials</li>
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/50 leading-relaxed max-w-md">
          Internal enterprise application. Usage is subject to firm policies, confidentiality agreements, and
          client engagement letters. No public marketing or benchmarking statements are shown here.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex flex-col items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Hauser</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">M&A Insurance Due Diligence</span>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
              <CardDescription>
                Access your assigned diligence engagements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative" suppressHydrationWarning>
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@hauser.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="relative" suppressHydrationWarning>
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-card px-2 text-muted-foreground">Demo roles</span>
                </div>
              </div>

              <div className="space-y-2">
                {demoAccounts.map((acct) => (
                  <Button
                    key={acct.email}
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleDemoLogin(acct.email)}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-start text-left gap-0.5">
                      <span className="font-medium">{acct.name}</span>
                      <span className="text-xs text-muted-foreground">{USER_ROLE_LABELS[acct.roleKey]}</span>
                      <span className="text-xs text-muted-foreground">{acct.email}</span>
                    </div>
                  </Button>
                ))}
              </div>

              <p className="text-xs text-center text-muted-foreground pt-1">
                Demo password for all accounts:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">demo123</code>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
