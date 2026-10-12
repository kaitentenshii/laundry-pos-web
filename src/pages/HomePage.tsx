import { Link } from 'react-router'
import { PageHeading } from '../components/PageHeading'

const areas = [
  { to: '/customers', title: 'Customers', description: 'A dedicated space for customer details and laundry history.' },
  { to: '/services', title: 'Laundry services', description: 'A dedicated space for laundry services and pricing.' },
]

export function HomePage() {
  return (
    <>
      <PageHeading title="Welcome to Laundry POS" description="The starting point for your laundry operations. Customer and service features will be added as development continues." />
      <section aria-label="Workspace areas" className="mt-10 grid gap-5 sm:grid-cols-2">
        {areas.map(({ to, title, description }) => (
          <Link key={to} to={to} className="rounded-xl border border-slate-200 bg-white p-7 transition-colors hover:border-teal-600">
            <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Coming soon</p>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 leading-7 text-slate-600">{description}</p>
            <p className="mt-6 text-sm font-medium text-teal-700">View section <span aria-hidden="true">→</span></p>
          </Link>
        ))}
      </section>
    </>
  )
}
