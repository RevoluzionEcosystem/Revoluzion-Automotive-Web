import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 60

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('sales_invoices').select('invoice_number, customer_company').eq('id', id).single()
  const title = data?.invoice_number ?? 'Invoice'
  return { title }
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: inv } = await supabase
    .from('sales_invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  if (!inv) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold gradient-text">{inv.invoice_number || 'Invoice'}</h1>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" disabled>Print View (removed)</button>
          <Link href={`/admin/invoices/${inv.id}`} className="btn-primary">Manage</Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-text-muted">Billed To</div>
            {inv.customer_company && <div className="font-medium">{inv.customer_company}</div>}
            <div className="font-medium">{inv.customer_name}</div>
            <div className="text-xs text-text-muted">{inv.customer_email}</div>
            <div className="text-xs text-text-muted">{inv.customer_phone}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-muted">Amount Due</div>
            <div className="text-xl font-bold">RM {Number(inv.total || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Items</h3>
          <div className="mt-2 space-y-2">
            {inv.invoice_items?.map((it: any) => (
              <div key={it.id} className="flex justify-between">
                <div>{it.description}</div>
                <div className="text-right">{it.quantity} × RM {Number(it.unit_price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
