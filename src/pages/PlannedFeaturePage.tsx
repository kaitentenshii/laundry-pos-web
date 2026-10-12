import { Link } from 'react-router'
import { PageHeading } from '../components/PageHeading'

type PlannedFeaturePageProps = {
  title: string
  description: string
}

export function PlannedFeaturePage({ title, description }: PlannedFeaturePageProps) {
  return (
    <>
      <PageHeading title={title} description={description} />
      <p className="mt-8 inline-block rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">Coming soon</p>
      <div className="mt-8"><Link to="/" className="text-sm font-medium text-teal-700 hover:underline">Back to overview</Link></div>
    </>
  )
}
