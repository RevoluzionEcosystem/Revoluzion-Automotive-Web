'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export default function InvoicesPage() {
  const supabase = createClient()

  const { data: user } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['my-invoices', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, issue_date, due_date, total, status, customer_company')
        .eq('profile_id', user.id)
        .order('issue_date', { ascending: false })
      return data ?? []
    },
    enabled: !!user,
  })

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center text-text-muted">
        <p className="text-lg">Sign in to view your invoices</p>
        <a href="/login" className="btn-primary mt-4 inline-block">Sign In</a>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold gradient-text">My Invoices</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="card p-6 text-center text-text-muted">You have no invoices yet.</div>
          ) : (
            invoices.map((inv: any) => (
              <Link key={inv.id} href={`/profile/invoices/${inv.id}`} className="card p-4 flex justify-between items-center hover:bg-accent transition-colors">
                <div>
                  <div className="font-semibold">{inv.invoice_number || 'Invoice'}</div>
                  {inv.customer_company && <div className="text-xs text-text-muted">{inv.customer_company}</div>}
                  <div className="text-xs text-text-muted">{inv.issue_date ? format(new Date(inv.issue_date), 'dd MMM yyyy') : ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">RM {Number(inv.total || 0).toFixed(2)}</div>
                  <div className="text-xs text-text-muted">{inv.status}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
