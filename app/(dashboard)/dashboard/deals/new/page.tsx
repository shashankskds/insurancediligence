'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/lib/store'
import { DEAL_PHASES, PRACTICE_LINES, type DealPhase, type DealStatus, type PracticeLine, USER_ROLE_LABELS } from '@/lib/types'

export default function NewDealPage() {
  const router = useRouter()
  const { currentUser, users, createDeal, logActivity } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    targetCompany: '',
    acquirer: '',
    industry: '',
    geography: '',
    specialExposures: '',
    description: '',
    dealValue: '',
    broker: '',
    revenue: '',
    ebitda: '',
    practiceLine: 'both' as PracticeLine,
    phase: 'preliminary' as DealPhase,
    status: 'active' as DealStatus,
    assignedAnalysts: [] as string[],
  })

  const assignableUsers = users.filter(u => u.role === 'analyst' || u.role === 'team_lead')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    
    setIsSubmitting(true)

    const exposures = formData.specialExposures
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)

    const deal = createDeal({
      name: formData.name,
      targetCompany: formData.targetCompany,
      acquirer: formData.acquirer,
      industry: formData.industry || undefined,
      geography: formData.geography || undefined,
      specialExposures: exposures.length ? exposures : undefined,
      description: formData.description,
      dealValue: formData.dealValue ? parseFloat(formData.dealValue) : undefined,
      broker: formData.broker || undefined,
      revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
      ebitda: formData.ebitda ? parseFloat(formData.ebitda) : undefined,
      practiceLine: formData.practiceLine,
      phase: formData.phase,
      status: formData.status,
      assignedAnalysts: formData.assignedAnalysts,
      createdBy: currentUser.id,
    })

    logActivity({
      dealId: deal.id,
      userId: currentUser.id,
      action: 'created',
      details: `Created deal: ${deal.name}`,
      entityType: 'deal',
      entityId: deal.id,
    })

    router.push(`/dashboard/deals/${deal.id}`)
  }

  const toggleAnalyst = (analystId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedAnalysts: prev.assignedAnalysts.includes(analystId)
        ? prev.assignedAnalysts.filter(id => id !== analystId)
        : [...prev.assignedAnalysts, analystId]
    }))
  }

  if (currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground mb-4">Only admins can create new deals.</p>
          <Link href="/dashboard/deals">
            <Button variant="outline">Back to Deals</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/deals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Create New Deal</h2>
          <p className="text-muted-foreground">Open a new insurance diligence engagement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Deal Information</CardTitle>
            <CardDescription>Enter the basic details for this deal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Deal Name / Code Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="e.g., Project Atlas"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="dealValue" className="text-sm font-medium">
                  Deal Value (USD)
                </label>
                <Input
                  id="dealValue"
                  type="number"
                  placeholder="e.g., 50000000"
                  value={formData.dealValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealValue: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="targetCompany" className="text-sm font-medium">
                  Target Company <span className="text-destructive">*</span>
                </label>
                <Input
                  id="targetCompany"
                  placeholder="Company being acquired"
                  value={formData.targetCompany}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCompany: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="acquirer" className="text-sm font-medium">
                  PE buyer <span className="text-destructive">*</span>
                </label>
                <Input
                  id="acquirer"
                  placeholder="Sponsor / financial buyer"
                  value={formData.acquirer}
                  onChange={(e) => setFormData(prev => ({ ...prev, acquirer: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="broker" className="text-sm font-medium">
                  Broker
                </label>
                <Input
                  id="broker"
                  placeholder="Retail / wholesale broker on the program"
                  value={formData.broker}
                  onChange={(e) => setFormData(prev => ({ ...prev, broker: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="revenue" className="text-sm font-medium">
                  LTM revenue (USD)
                </label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="Target LTM revenue"
                  value={formData.revenue}
                  onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="ebitda" className="text-sm font-medium">
                  LTM EBITDA (USD)
                </label>
                <Input
                  id="ebitda"
                  type="number"
                  placeholder="Target LTM EBITDA"
                  value={formData.ebitda}
                  onChange={(e) => setFormData(prev => ({ ...prev, ebitda: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Practice line</label>
                <Select
                  value={formData.practiceLine}
                  onValueChange={(value: PracticeLine) => setFormData(prev => ({ ...prev, practiceLine: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PRACTICE_LINES) as PracticeLine[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {PRACTICE_LINES[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </label>
                <Input
                  id="industry"
                  placeholder="e.g., Manufacturing"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="geography" className="text-sm font-medium">
                  Geography
                </label>
                <Input
                  id="geography"
                  placeholder="Regions, states, or countries in scope"
                  value={formData.geography}
                  onChange={(e) => setFormData(prev => ({ ...prev, geography: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="specialExposures" className="text-sm font-medium">
                  Special exposures
                </label>
                <Textarea
                  id="specialExposures"
                  placeholder="One per line or comma-separated (e.g., legacy liability, coastal wind, ASO medical)"
                  value={formData.specialExposures}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialExposures: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Scope of review, key dates, and sponsor expectations"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Deal Phase</label>
                <Select
                  value={formData.phase}
                  onValueChange={(value: DealPhase) => setFormData(prev => ({ ...prev, phase: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DEAL_PHASES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: DealStatus) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Assign analysts & team leads</label>
              <div className="space-y-2">
                {assignableUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Checkbox
                      id={u.id}
                      checked={formData.assignedAnalysts.includes(u.id)}
                      onCheckedChange={() => toggleAnalyst(u.id)}
                    />
                    <label htmlFor={u.id} className="text-sm cursor-pointer">
                      {u.name}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {USER_ROLE_LABELS[u.role]} · {u.email}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/dashboard/deals">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </div>
  )
}
