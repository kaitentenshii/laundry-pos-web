import { dateTime, money, paymentMethodLabels } from '../services/orders'
import type { Payment } from '../services/orders'
export function PaymentReceipt({ payment }: { payment: Payment }) {
  return <dl className="payment-receipt"><dt>Metode</dt><dd>{paymentMethodLabels[payment.method]}</dd><dt>Tanggal pembayaran</dt><dd>{dateTime(payment.paid_at)}</dd><dt>Nominal diterima</dt><dd>{money(payment.amount_received)}</dd><dt>Pelunasan</dt><dd>{money(payment.amount_settled)}</dd><dt>Kembalian tunai</dt><dd>{money(payment.change_amount)}</dd><dt>Dicatat oleh</dt><dd>{payment.creator_name}</dd>{payment.notes && <><dt>Catatan pembayaran</dt><dd>{payment.notes}</dd></>}</dl>
}
