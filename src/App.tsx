import { Route, Routes } from 'react-router'
import { AppLayout } from './layouts/WorkspaceLayout'
import { HomePage } from './pages/HomePage'
import { PlannedFeaturePage } from './pages/PlannedFeaturePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireRole } from './auth/RequireRole'
import { UsersPage } from './pages/UsersPage'
import { CustomersPage } from './pages/CustomersPage'
import { ServicesPage } from './pages/ServicesPage'
import { NewOrderPage } from './pages/NewOrderPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="orders/new" element={<NewOrderPage />} />
          <Route path="notifications" element={<PlannedFeaturePage title="Notifikasi WhatsApp" description="Belum ada notifikasi yang dapat ditampilkan." />} />
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="settings" element={<PlannedFeaturePage title="Pengaturan" description="Pengaturan laundry." />} />
            <Route path="reports" element={<PlannedFeaturePage title="Laporan" description="Belum ada laporan yang dapat ditampilkan." />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
