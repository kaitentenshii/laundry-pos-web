# Pengujian development Sprint 3

Dashboard, laporan, filter periode, dan profil laundry mengikuti frame Figma `5:244`, `59:1409`, `59:1750`, dan `5:253`. Sidebar menggunakan aset SVG dan font Outfit yang sudah tersedia di aplikasi.

## Menjalankan pemeriksaan

```sh
npm ci
npm run lint
npm run build
npm test
```

Suite memiliki 64 pengujian. Empat worker membatasi perebutan CPU/memori saat beberapa lingkungan jsdom dibuat bersamaan.

## Pengujian browser dengan API dan PostgreSQL

Jalankan API dengan database QA yang sudah dimigrasikan sampai versi 12, lalu jalankan Vite dengan `VITE_API_BASE_URL` mengarah ke API tersebut. Siapkan akun admin dan kasir aktif di database QA.

Pasang browser dengan `npx playwright install chromium`, atau gunakan Edge lokal melalui `E2E_BROWSER_CHANNEL=msedge`. Atur variabel environment berikut pada terminal yang menjalankan tes:

| Variabel | Isi |
| --- | --- |
| E2E_API_URL | Default `http://127.0.0.1:18080` |
| E2E_WEB_URL | Default `http://127.0.0.1:5173` |
| E2E_ADMIN_USER / E2E_ADMIN_PASSWORD | Kredensial admin QA |
| E2E_CASHIER_USER / E2E_CASHIER_PASSWORD | Kredensial kasir QA |
| E2E_ALLOW_SEED | `true` untuk mengizinkan data QA baru |

Jalankan `npm run test:e2e`. Script hanya menerima server lokal. Ia membuat pelanggan, layanan, pesanan, pembayaran, dan riwayat yang tetap tersimpan; layanan QA dinonaktifkan saat tes selesai. Gunakan database khusus QA. Screenshot dan hasil JSON berada di `test-results/` dan diabaikan Git.

Verifikasi meliputi login/RBAC, pelanggan, kg/pcs, total Rp57.000, snapshot harga setelah master berubah, batal/konfirmasi status, pickup sebelum lunas ditolak, kas Rp60.000/kembalian Rp3.000, pickup idempotent, empat riwayat, jumlah pesanan pelanggan, penerimaan dashboard bertambah Rp57.000, pencarian/filter, dan viewport 390 × 844.

Pengujian browser tambahan pada development ini memverifikasi filter laporan apply/reset/empty period, profil tersimpan setelah refresh, perubahan identitas sidebar, validasi nomor kontak, dan draft tetap ada saat API menolak input.

## Perbaikan yang diverifikasi

- Identitas sidebar kini diperbarui setelah penyimpanan profil; konteks layout diteruskan melalui penjaga role.
- Mock pengujian login/pesanan diperbarui untuk endpoint identitas tambahan, tanpa mengandalkan urutan panggilan jaringan.
- Penanda pesanan terlambat menggunakan waktu snapshot API yang sama dengan hitungan dashboard.

WhatsApp/queue/retry/webhook tetap dikerjakan manual. Deployment di-hold. Penerimaan mitra belum dilakukan; lihat checklist UAT.
