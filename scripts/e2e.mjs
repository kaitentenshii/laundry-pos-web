import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const api = process.env.E2E_API_URL || 'http://127.0.0.1:18080'
const ui = process.env.E2E_WEB_URL || 'http://127.0.0.1:5173'
for (const url of [api, ui]) assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Use a dedicated local QA environment')
for (const name of ['E2E_ADMIN_USER', 'E2E_ADMIN_PASSWORD', 'E2E_CASHIER_USER', 'E2E_CASHIER_PASSWORD']) assert.ok(process.env[name], `Set ${name}`)
assert.equal(process.env.E2E_ALLOW_SEED, 'true', 'Set E2E_ALLOW_SEED=true: this test creates persistent QA customers, services and orders')
fs.mkdirSync('test-results', { recursive: true })
const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || undefined, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } })
const runtimeErrors = []
const transitions = []
page.on('pageerror', error => runtimeErrors.push(error.message))
page.on('request', request => { if (request.url().endsWith('/status') && request.method() === 'PATCH') transitions.push(request.postDataJSON()) })
let adminHeaders, kg, item
async function data(response, status = 200) {
  assert.equal(response.status(), status)
  return (await response.json()).data
}
async function login(user, password) {
  await page.getByLabel('Username atau email', { exact: true }).fill(user)
  await page.getByLabel('Kata sandi', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Masuk ke ruang kerja' }).click()
}
try {
  const response = await page.request.post(api + '/auth/login', { data: { identifier: process.env.E2E_ADMIN_USER, password: process.env.E2E_ADMIN_PASSWORD } })
  assert.equal(response.status(), 200)
  adminHeaders = { Authorization: 'Bearer ' + (await response.json()).access_token }
  const baseline = await data(await page.request.get(api + '/dashboard', { headers: adminHeaders }))
  const suffix = crypto.randomUUID().slice(0, 8)
  const customer = await data(await page.request.post(api + '/customers', { headers: adminHeaders, data: { name: 'QA Customer ' + suffix, whatsapp: '081234567890', whatsapp_opt_in: false, address: 'QA address', notes: 'QA notes' } }), 201)
  kg = await data(await page.request.post(api + '/services', { headers: adminHeaders, data: { name: 'QA Cuci ' + suffix, unit: 'KG', price: 8000, estimated_hours: 48, is_active: true } }), 201)
  item = await data(await page.request.post(api + '/services', { headers: adminHeaders, data: { name: 'QA Selimut ' + suffix, unit: 'ITEM', price: 25000, estimated_hours: 72, is_active: true } }), 201)
  await page.goto(ui + '/orders/new?customer_id=' + customer.id)
  await login(process.env.E2E_CASHIER_USER, process.env.E2E_CASHIER_PASSWORD)
  await page.getByLabel('Pelanggan terpilih').waitFor()
  await page.getByLabel('Layanan *', { exact: true }).selectOption(String(kg.id))
  await page.getByLabel('Berat (kg) *', { exact: true }).fill('4')
  await page.getByRole('button', { name: '+ Tambah layanan' }).click()
  await page.getByLabel('Layanan 2 *').selectOption(String(item.id))
  await page.getByLabel('Jumlah (pcs) 2 *').fill('1')
  const due = new Date(); due.setDate(due.getDate() + 7)
  await page.getByLabel('Tanggal selesai *').fill(due.toISOString().slice(0, 10))
  await page.getByLabel('Catatan cucian').fill('QA integration: tanpa pewangi.')
  await page.getByRole('button', { name: 'Simpan pesanan' }).click()
  await page.getByRole('heading', { name: 'Pesanan berhasil disimpan' }).waitFor()
  const number = await page.getByLabel('Nomor pesanan').textContent()
  const id = Number(number.split('-')[1])
  const token = await page.evaluate(() => JSON.parse(sessionStorage.getItem('laundry-pos-session')).accessToken)
  const cashierHeaders = { Authorization: 'Bearer ' + token }
  const orderURL = api + '/orders/' + id
  let order = await data(await page.request.get(orderURL, { headers: cashierHeaders }))
  assert.equal(order.total, 57000)
  assert.equal(order.items.length, 2)
  await data(await page.request.put(api + '/services/' + kg.id, { headers: adminHeaders, data: { name: kg.name, unit: 'KG', price: 10000, estimated_hours: 48, is_active: true } }))
  order = await data(await page.request.get(orderURL, { headers: cashierHeaders }))
  assert.equal(order.total, 57000); assert.equal(order.items[0].unit_price, 8000)
  await page.goto(ui + '/orders/' + id)
  await page.getByRole('button', { name: 'Mulai dicuci' }).click()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  assert.equal(transitions.length, 0)
  await page.getByRole('button', { name: 'Mulai dicuci' }).click()
  await page.getByRole('button', { name: 'Ya, mulai dicuci' }).click()
  await page.getByRole('button', { name: 'Tandai selesai' }).click()
  await page.getByRole('button', { name: 'Ya, tandai selesai' }).click()
  await page.getByText('Lunasi pembayaran sebelum menyerahkan cucian kepada pelanggan.', { exact: true }).waitFor()
  assert.equal((await page.request.patch(orderURL + '/status', { headers: cashierHeaders, data: { from_status: 'COMPLETED', status: 'PICKED_UP', handover_confirmed: true, request_key: crypto.randomUUID() } })).status(), 409)
  await page.getByRole('link', { name: 'Catat pembayaran', exact: true }).click()
  await page.getByLabel('Nominal diterima (Rp) *').fill('60000')
  await page.getByRole('button', { name: 'Simpan pembayaran' }).click()
  await page.getByRole('dialog').waitFor()
  assert.ok((await page.getByRole('dialog').innerText()).includes('3.000'))
  await page.getByRole('button', { name: 'Kembali ke detail pesanan', exact: true }).click()
  await page.getByRole('button', { name: 'Tandai diambil' }).click()
  await page.getByRole('button', { name: 'Batal', exact: true }).click()
  assert.equal((await data(await page.request.get(orderURL, { headers: cashierHeaders }))).status, 'COMPLETED')
  await page.getByRole('button', { name: 'Tandai diambil' }).click()
  await page.getByRole('button', { name: 'Ya, pesanan diambil' }).click()
  await page.getByText('Cucian sudah diserahkan kepada pelanggan.', { exact: true }).waitFor()
  order = await data(await page.request.get(orderURL, { headers: cashierHeaders }))
  assert.equal(order.status, 'PICKED_UP'); assert.equal(order.balance, 0)
  assert.equal(order.payment.change_amount, 3000); assert.equal(order.history.length, 4)
  await data(await page.request.patch(orderURL + '/status', { headers: cashierHeaders, data: transitions.at(-1) }))
  assert.equal((await data(await page.request.get(orderURL + '/history', { headers: cashierHeaders }))).length, 4)
  assert.equal((await data(await page.request.get(api + '/customers/' + customer.id, { headers: cashierHeaders }))).order_count, 1)
  for (const path of ['/reports/transactions', '/settings/profile']) assert.equal((await page.request.get(api + path, { headers: cashierHeaders })).status(), 403)
  await page.goto(ui + '/reports'); await page.getByRole('heading', { name: 'Akses dibatasi' }).waitFor()
  await page.goto(ui + '/settings'); await page.getByRole('heading', { name: 'Akses dibatasi' }).waitFor()
  const dashboard = await data(await page.request.get(api + '/dashboard', { headers: cashierHeaders }))
  assert.equal(dashboard.receipts, baseline.receipts + 57000)
  await page.goto(ui + '/'); await page.getByText('Pesanan aktif', { exact: true }).waitFor()
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  await page.goto(ui + '/orders'); await page.getByLabel('Cari pesanan').fill(number)
  await page.getByRole('button', { name: 'Cari', exact: true }).click()
  await page.getByRole('button', { name: 'Diambil', exact: true }).click()
  await page.getByLabel('Pembayaran', { exact: true }).selectOption('PAID')
  await page.getByRole('link', { name: number, exact: true }).waitFor()
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  assert.deepEqual(runtimeErrors, [])
  fs.writeFileSync('test-results/integration.json', JSON.stringify({ order: number, total: order.total, status: order.status, history: order.history.length, passed: true, whatsapp: 'manual; not tested' }, null, 2))
  console.log('PASS: login, customer, kg/pcs order, price snapshot, status confirmation, cash settlement, pickup, retries, RBAC, dashboard receipts and mobile')
} finally {
  for (const service of [kg, item].filter(Boolean)) {
    if (adminHeaders) await page.request.put(api + '/services/' + service.id, { headers: adminHeaders, data: { name: service.name, unit: service.unit, price: service.price, estimated_hours: service.estimated_hours, is_active: false } }).catch(() => {})
  }
  await browser.close()
}
