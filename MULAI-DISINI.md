# WorkRecord — Panduan Menjalankan Source Code

Website company profile WorkRecord menggunakan React 19, TypeScript (TSX), Tailwind CSS 4, dan Vinext/Vite dengan struktur App Router.

## Menjalankan di komputer Anda

1. Instal Node.js versi 22.13 atau lebih baru.
2. Ekstrak ZIP, lalu buka folder `WorkRecord` menggunakan Visual Studio Code.
3. Buka terminal di folder tersebut.
4. Instal dependensi menggunakan lockfile yang disertakan:

```sh
npx pnpm@10 install --frozen-lockfile
```

5. Jalankan website:

```sh
npm run dev
```

6. Buka http://localhost:5173 di browser. Jika port berbeda, ikuti alamat yang ditampilkan terminal.

Koneksi internet diperlukan saat instalasi dependensi. Folder `node_modules` akan dibuat otomatis.

## File utama untuk diedit

- `app/page.tsx`: tampilan company profile, teks Indonesia–English, navigasi, dialog contoh record, dan detail paket.
- `app/globals.css`: Tailwind, warna, tipografi, dan tampilan responsif.
- `app/layout.tsx`: judul website, deskripsi, bahasa awal, dan favicon.
- `public/favicon.svg`: ikon website.
- `components/ui/`: komponen antarmuka.
- `package.json`: dependensi dan perintah proyek.
- `pnpm-lock.yaml`: versi dependensi yang digunakan.

## Pemeriksaan dan build

```sh
npx tsc --noEmit
npm run build
npm run start
```

`npm run start` menjalankan hasil build melalui runtime lokal Cloudflare/Wrangler. Ikuti alamat yang ditampilkan terminal. Proyek ini bukan template Vite SPA biasa; ia menggunakan Vinext dan konfigurasi Cloudflare yang disertakan.

## Cakupan website

Sudah tersedia: company profile responsif, pilihan bahasa Indonesia–English, contoh record, penjelasan Admin/Master, paket layanan, dan FAQ.

Login, langganan/pembayaran, pencarian tenaga kerja, approval operasional, dan database tenaga kerja belum diimplementasikan. Data profil adalah data contoh. Harga belum ditetapkan.

## Isi arsip

Kode aplikasi berasal dari versi website yang telah dibuat. Arsip tidak memuat `node_modules`, hasil build, cache, histori Git, atau kredensial. Identitas deployment khusus situs dihapus dari salinan konfigurasi dalam ZIP agar dapat dipakai sebagai salinan mandiri. Source website yang aktif tidak diubah.

`README.md` bawaan berisi dokumentasi teknis tambahan. Mulailah dari panduan ini.
