export type OrderItem = { id: number; service_id: number; price_version_id: number; service_name: string; unit: 'KG' | 'ITEM'; unit_price: number; quantity_milli: number; subtotal: number }
export type Order = { id: number; order_number: string; customer_id: number; customer_name: string; customer_whatsapp: string; customer_opt_in: boolean; created_by: number; creator_name: string; due_at: string; notes: string; status: string; payment_status: string; total: number; paid_amount: number; balance: number; created_at: string; updated_at: string; items: OrderItem[] }
export const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
export const dateTime = (value: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value))
export const statusLabels: Record<string, string> = { RECEIVED: 'Diterima', WASHING: 'Dicuci', COMPLETED: 'Selesai', PICKED_UP: 'Diambil' }

export const maxOrderTotal = 9000000000000
export function quoteLine(price: number, quantity: string, unit: 'KG' | 'ITEM') {
  const normalized = quantity.replace(',', '.')
  if (!/^\d{1,7}(\.\d{1,3})?$/.test(normalized) || !Number.isSafeInteger(price) || price < 0 || price > 999999999) return null
  const [whole, fraction = ''] = normalized.split('.')
  const milli = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
  if (milli < 1n || milli > 1000000000n || unit === 'ITEM' && milli % 1000n !== 0n) return null
  const subtotal = (BigInt(price) * milli + 500n) / 1000n
  if (subtotal > BigInt(maxOrderTotal)) return null
  return { normalized, quantityMilli: Number(milli), subtotal: Number(subtotal) }
}
