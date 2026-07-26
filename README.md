# PintuEvent

PintuEvent adalah platform pencarian, penjualan, dan pengelolaan tiket event.
Project mencakup beranda publik, portal customer, dashboard organizer, dashboard
admin, workflow Supabase, serta deployment Cloudflare melalui OpenAI Sites.

## Fitur

- Katalog event, kategori, pencarian, favorit, dan promo.
- Login demo dengan otorisasi berbasis role.
- Portal customer untuk tiket, pesanan, voucher, notifikasi, profil, checkout,
  dan simulasi pembayaran.
- Dashboard organizer untuk event, penjualan, peserta, check-in, keuangan,
  promosi, dan tim.
- Dashboard admin untuk pengguna, verifikasi, transaksi, refund, withdrawal,
  kategori, serta audit log.
- Mode demo otomatis ketika environment Supabase belum dikonfigurasi.
- RLS, RPC, storage policy, dan Edge Function pada folder `supabase/`.

## Teknologi

- Node.js `>=22.13.0`
- React 19, Next.js 16, Vinext, dan Vite
- TypeScript, ESLint, dan Prettier
- Supabase Auth, Database, Storage, RPC, dan Edge Functions
- Cloudflare Worker dan OpenAI Sites
- Playwright untuk black-box testing

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Perintah `dev`, `build`, `start`, `lint`, dan `test` dapat dijalankan pada
Windows, macOS, atau Linux. Aplikasi akan memakai data demo jika variabel
Supabase belum tersedia.

Untuk mengaktifkan Supabase, buat `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Jangan menyimpan service-role key di environment frontend. Operasi admin yang
memerlukannya harus dijalankan melalui Edge Function.

## Perintah utama

| Perintah                | Fungsi                                                |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Menjalankan development server                        |
| `npm run format`        | Memformat source, test, dan konfigurasi               |
| `npm run format:check`  | Memastikan formatting konsisten                       |
| `npm run lint`          | Menjalankan ESLint                                    |
| `npm run typecheck`     | Menjalankan pemeriksaan TypeScript                    |
| `npm run build`         | Membuat dan memvalidasi artefak production            |
| `npm test`              | Build dan regression test service/rendering           |
| `npm run test:blackbox` | Black-box test desktop dan mobile dengan Playwright   |
| `npm run verify`        | Format check, lint, type-check, build, dan regression |
| `npm run test:all`      | Seluruh verifikasi termasuk black-box test            |
| `npm run db:generate`   | Membuat migrasi Drizzle setelah perubahan schema D1   |

## Struktur project

```text
app/                 route, halaman, komponen, dan stylesheet
src/services/        akses data, autentikasi, validasi, dan workflow
src/types/           tipe domain bersama
supabase/migrations/ schema, RLS, RPC, dan policy
supabase/functions/  Edge Functions
tests/               regression dan black-box test
worker/              entry Cloudflare Worker Vinext
scripts/             helper build dan validasi lintas platform
.openai/hosting.json koneksi project OpenAI Sites
```

## Autentikasi dan akses Sites

Deployment Sites dapat memakai halaman **Continue with ChatGPT** sebelum
pengunjung mencapai aplikasi. Kebijakan akses deployment dikelola oleh Sites,
sedangkan role customer, organizer, dan admin dikelola oleh aplikasi/Supabase.

Helper opsional Sign in with ChatGPT tersedia di `app/chatgpt-auth.ts`. Route
`/signin-with-chatgpt`, `/signout-with-chatgpt`, dan `/callback` dikelola oleh
platform dan tidak boleh dibuat ulang di aplikasi.

## Lifecycle deployment

OpenAI Sites membangun commit yang sudah didorong ke source branch dengan
`npm run build`. Pada Linux, build tetap memakai helper bounded di
`scripts/build-verified.sh`; pada Windows, dispatcher Node menjalankan Vinext
dan validasi artefak yang setara.

`npm run install:ci` khusus lifecycle Linux Sites dan memerlukan `flock`,
`curl`, serta GNU `timeout`. Folder `.sites-runtime/`, `.wrangler/`, `dist/`,
dan hasil Playwright bersifat lokal/generated dan tidak disimpan ke Git.
