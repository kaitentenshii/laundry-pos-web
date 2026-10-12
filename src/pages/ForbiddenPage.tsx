import { Link } from 'react-router'

export function ForbiddenPage() {
  return (
    <>
      <header className="page-heading"><h1>Akses dibatasi</h1><p>Halaman ini membutuhkan akun administrator.</p></header>
      <section className="feedback-panel feedback-error" role="alert">
        <h2>Fitur ini hanya tersedia untuk admin</h2>
        <p>Akun kasir tetap dapat menggunakan pesanan, pelanggan, dan notifikasi.</p>
        <Link className="workspace-button" to="/customers">Kembali ke pelanggan</Link>
      </section>
    </>
  )
}
