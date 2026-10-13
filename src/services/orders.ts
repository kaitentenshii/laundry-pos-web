export type OrderItem = { id: number; service_id: number; price_version_id: number; service_name: string; unit: 'KG' | 'ITEM'; unit_price: number; quantity_milli: number; subtotal: number }
export type Order = { id: number; order_number: string; customer_id: number; customer_name: string; customer_whatsapp: string; customer_opt_in: boolean; created_by: number; creator_name: string; due_at: string; notes: string; status: string; payment_status: string; total: number; created_at: string; updated_at: string; items: OrderItem[] }
export const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
export const dateTime = (value: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(value))
export const statusLabels: Record<string, string> = { RECEIVED: 'Diterima', WASHING: 'Dicuci', COMPLETED: 'Selesai', PICKED_UP: 'Diambil' }
