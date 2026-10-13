import { expect, it } from 'vitest'
import { quoteLine } from './orders'
it('rounds each subtotal half-up using integer arithmetic', () => {
  expect(quoteLine(999, '0,5', 'KG')?.subtotal).toBe(500)
  expect(quoteLine(8000, '4.125', 'KG')?.subtotal).toBe(33000)
  expect(quoteLine(1, '0.499', 'KG')?.subtotal).toBe(0)
  expect(quoteLine(1, '0.500', 'KG')?.subtotal).toBe(1)
  expect(quoteLine(999999999, '9000', 'ITEM')?.subtotal).toBe(8999999991000)
})
it('rejects invalid units, precision, and excessive subtotal', () => {
  expect(quoteLine(1000, '1.5', 'ITEM')).toBeNull()
  expect(quoteLine(1000, '1.0001', 'KG')).toBeNull()
  expect(quoteLine(999999999, '10000', 'ITEM')).toBeNull()
  expect(quoteLine(1000, '0', 'KG')).toBeNull()
})
