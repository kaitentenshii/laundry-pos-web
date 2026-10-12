import { Route, Routes } from 'react-router'
import { AppLayout } from './layouts/WorkspaceLayout'
import { HomePage } from './pages/HomePage'
import { PlannedFeaturePage } from './pages/PlannedFeaturePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireRole } from './auth/RequireRole'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="customers" element={<PlannedFeaturePage title="Customers" description="Customer management will be available here in a future update." />} />
          <Route path="orders" element={<PlannedFeaturePage title="Pesanan" description="Belum ada pesanan yang dapat ditampilkan." />} />
          <Route path="notifications" element={<PlannedFeaturePage title="Notifikasi WhatsApp" description="Belum ada notifikasi yang dapat ditampilkan." />} />
          <Route element={<RequireRole roles={['admin']} />}>
            <Route path="users" element={<PlannedFeaturePage title="Pengguna & akses" description="Kelola akun internal admin dan kasir." />} />
            <Route path="services" element={<PlannedFeaturePage title="Laundry services" description="Service management and pricing will be available here in a future update." />} />
            <Route path="settings" element={<PlannedFeaturePage title="Pengaturan" description="Pengaturan laundry." />} />
            <Route path="reports" element={<PlannedFeaturePage title="Laporan" description="Belum ada laporan yang dapat ditampilkan." />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
