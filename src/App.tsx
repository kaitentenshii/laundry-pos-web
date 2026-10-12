import { Route, Routes } from 'react-router'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { PlannedFeaturePage } from './pages/PlannedFeaturePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="customers" element={<PlannedFeaturePage title="Customers" description="Customer management will be available here in a future update." />} />
        <Route path="services" element={<PlannedFeaturePage title="Laundry services" description="Service management and pricing will be available here in a future update." />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
