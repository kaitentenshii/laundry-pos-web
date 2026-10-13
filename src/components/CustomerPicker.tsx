import { useEffect, useId, useRef, useState } from 'react'
import { useCollection } from '../hooks/useCollection'
import type { Customer } from '../pages/CustomersPage'
import { CreateCustomerModal } from './CreateCustomerModal'
import { Icon } from './Icon'

type Props = { selected: Customer | null; onSelect: (customer: Customer) => void; onClear: () => void; disabled?: boolean; loadingSelected?: boolean; error?: string }
export function CustomerPicker({ selected, onSelect, onClear, disabled = false, loadingSelected = false, error }: Props) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [creating, setCreating] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(search.trim()), 200); return () => window.clearTimeout(timer) }, [search])
  const results = useCollection<Customer>(open && !selected ? `/customers?q=${encodeURIComponent(debounced)}&page_size=8` : null)
  const pending = search.trim() !== debounced || results.loading
  const index = Math.max(0, Math.min(active, results.data.length - 1))
  useEffect(() => { if (open && !pending) list.current?.children[index]?.scrollIntoView?.({ block: 'nearest' }) }, [index, open, pending])
  function choose(customer: Customer) { setOpen(false); setSearch(''); onSelect(customer) }
  function change() { onClear(); setSearch(''); setOpen(true); setActive(0); requestAnimationFrame(() => input.current?.focus()) }
  if (loadingSelected && !selected) return <p role="status" className="field-hint">Memuat pelanggan…</p>
  return <>
    {selected ? <div className="picker-selected" aria-label="Pelanggan terpilih"><div className="picker-selected-main"><span className="picker-avatar picker-avatar-selected"><Icon name="customer" /></span><div className="picker-contact"><strong>{selected.name}</strong><span>{selected.whatsapp}</span></div><button type="button" className="picker-change" onClick={change} disabled={disabled}><Icon name="swap" />Ganti</button></div><div className="picker-selected-consent"><span className={`picker-consent ${selected.whatsapp_opt_in ? 'picker-approved' : ''}`}>{selected.whatsapp_opt_in ? 'WA disetujui' : 'Belum disetujui'}</span><p>{selected.whatsapp_opt_in ? 'Pelanggan bersedia menerima notifikasi status pesanan.' : 'Persetujuan notifikasi WhatsApp belum diberikan.'}</p></div></div> : <div className="customer-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
      <label className="picker-label" htmlFor={`${id}-input`}>Cari pelanggan *</label><div className={`picker-search-input ${open ? 'picker-focused' : ''}`}><Icon name="search" /><input ref={input} id={`${id}-input`} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-results`} aria-activedescendant={open && !pending && results.data[index] ? `${id}-option-${index}` : undefined} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} autoComplete="off" placeholder="Cari nama atau nomor WhatsApp" value={search} disabled={disabled} maxLength={120} onFocus={() => setOpen(true)} onChange={event => { setSearch(event.target.value); setActive(0); setOpen(true) }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!open) { setOpen(true); setActive(0) } else if (results.data.length) setActive(value => (value + (event.key === 'ArrowDown' ? 1 : -1) + results.data.length) % results.data.length) }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (!pending && results.data[index]) choose(results.data[index]) }
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      }} />{search && <button type="button" className="picker-icon-button" aria-label="Hapus pencarian pelanggan" disabled={disabled} onClick={() => { setSearch(''); setActive(0); input.current?.focus() }}><Icon name="clear" /></button>}</div>
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
      {open && <div className="picker-dropdown">{pending ? <p className="picker-feedback" role="status">Mencari pelanggan…</p> : results.error ? <div className="picker-feedback" role="alert"><p>{results.error}</p><button type="button" className="table-action" onClick={results.reload}>Coba lagi</button></div> : !results.data.length ? <p className="picker-feedback">Pelanggan tidak ditemukan.</p> : <ul ref={list} id={`${id}-results`} role="listbox" aria-label="Hasil pencarian pelanggan">{results.data.map((customer, option) => <li key={customer.id} id={`${id}-option-${option}`} role="option" aria-selected={option === index} className={option === index ? 'picker-active' : ''} onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(option)} onClick={() => choose(customer)}><span className="picker-avatar"><Icon name="customer" /></span><div className="picker-contact"><strong>{customer.name}</strong><span>{customer.whatsapp}</span></div><span className={`picker-consent ${customer.whatsapp_opt_in ? 'picker-approved' : ''}`}>{customer.whatsapp_opt_in ? 'WA disetujui' : 'Belum disetujui'}</span></li>)}</ul>}{!pending && results.total > results.data.length && <p className="picker-result-count">Menampilkan {results.data.length} dari {results.total} pelanggan. Persempit pencarian Anda.</p>}<button type="button" className="picker-add" onClick={() => { setCreating(true); setOpen(false) }} disabled={disabled}><span className="picker-add-icon"><Icon name="plus" /></span><span><strong>Tambah pelanggan baru</strong><span>Daftarkan pelanggan baru ke sistem</span></span></button></div>}
    </div>}
    {creating && <CreateCustomerModal query={search} onClose={() => { setCreating(false); setOpen(true); requestAnimationFrame(() => input.current?.focus()) }} onSaved={customer => { setCreating(false); choose(customer) }} />}
  </>
}
