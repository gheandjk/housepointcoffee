# ☕ Housepoint — Coffee Shop Management System

Sistem manajemen operasional coffee shop terintegrasi dengan **Hermes AI Assistant**, pencatatan transaksi kasir, manajemen stok bahan baku, katalog menu, dan analisis funnel penjualan.

---

## 🚀 Fitur Utama
1. **Housepoint AI (Terhubung ke Hermes AI Gateway)**:
   - Asisten cerdas operasional coffee shop di port 3000 & Hermes Gateway port 8642.
   - Siap menjawab pertanyaan seputar resep kopi, manajemen stok bahan baku, HPP, ide promosi, dan SOP barista.
2. **Katalog & Manajemen Menu Kopi**:
   - Tambah menu baru dengan kategori (Coffee, Non-Coffee, Pastry, Signature), harga, deskripsi, dan ikon emoji.
   - Filter instan per kategori & pencarian live search.
3. **Kasir & Orders**:
   - Catat pesanan pelanggan langsung memilih dari daftar menu yang tersedia.
   - Otomatis menghitung subtotal & total.
   - Pilihan metode bayar (QRIS, Tunai, Kartu) & tipe pesanan (Dine-in / Take-away).
   - Ubah status pesanan (Preparing ➔ Completed) dengan 1 klik.
4. **Inventory & Bahan Baku**:
   - Pantau stok biji kopi, susu, sirup, powder, dan packaging (cup).
   - Fitur **Restock Cepat (+10)** langsung dari tabel.
   - Peringatan stok otomatis: *Good*, *Low Stock*, atau *Out of Stock*.
5. **Pencatatan Pengeluaran (Expenses)**:
   - Catat pengeluaran operasional harian kedai kopi.
6. **Sales Funneling & Laporan**:
   - Visualisasi piramida konversi pengunjung hingga transaksi berhasil.
7. **Penyimpanan Data Mandiri (Local Storage)**:
   - Data menu, pesanan, inventory, dan pengeluaran tersimpan rapi dan tidak hilang saat browser di-refresh.
   - Tersedia tombol reset ke data demo awal kapan saja di menu Settings.

---

## 💻 Cara Menjalankan

### Cara 1: Menggunakan Node.js (Rekomendasi untuk AI Aktif)
1. Buka terminal di folder project:
   ```bash
   npm start
   ```
2. Buka browser di:
   ```
   http://127.0.0.1:3000
   ```

### Cara 2: Menggunakan Live Server di VS Code
1. Buka file `index.html` di VS Code.
2. Klik kanan lalu pilih **"Open with Live Server"**.
3. Pastikan `npm start` juga berjalan di background agar Housepoint AI dapat merespons.

---

## 🔐 Akun Demo Administrator
- **Email:** `admin@housepoint.com`
- **Password:** `housepoint123`
