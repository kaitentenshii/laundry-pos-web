import { Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/WorkspaceLayout'
import { LoginPage } from '../pages/LoginPage'
import { RequireAuth } from './RequireAuth'

// Authentication tests isolate navigation from feature-specific data requests.
export default function TestApp() {
  return <Routes><Route path="login" element={<LoginPage />} /><Route element={<RequireAuth />}><Route element={<AppLayout />}><Route index element={<h1>Welcome to Laundry POS</h1>} /><Route path="customers" element={<h1>Customers</h1>} /></Route></Route></Routes>
}
