export function reportPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = (type: string) => parts.find(part => part.type === type)!.value
  const to = `${get('year')}-${get('month')}-${get('day')}`
  return { from: to.slice(0, 8) + '01', to }
}
