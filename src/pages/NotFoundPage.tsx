import { Link } from 'react-router'
import { PageHeading } from '../components/PageHeading'

export function NotFoundPage() {
  return (
    <>
      <PageHeading title="Page not found" description="We couldn’t find the page you’re looking for." />
      <Link to="/" className="mt-8 inline-flex rounded-lg bg-teal-700 px-5 py-3 text-sm font-medium text-white hover:bg-teal-800">Back to overview</Link>
    </>
  )
}
