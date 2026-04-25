🚀 TARIK: MASTER PROJECT BRIEF

"Gamified Lossless Yield Wars"
Satu Codebase. Tiga Chain. Tiga Kemenangan.

1. INTISARI KONSEP (ELEVATOR PITCH)

TARIK adalah platform DeFi berbasis gamifikasi di mana pengguna mempertaruhkan native MON di Monad ke salah satu dari dua kubu yang sedang "bertanding" (Misal: Bull vs Bear, Tim A vs Tim B).

Aturan Emas:

Modal (Principal) 100% AMAN dan bisa ditarik kembali.

Semua dana di-stake ke mock yield generator (simulasi Aave/Compound).

Kubu yang menang mendapatkan kembali modal mereka + SELURUH YIELD dari kedua kubu.

Kubu yang kalah mendapatkan kembali modal mereka (0% yield).

2. STRATEGI HACKATHON (PENGATURAN TEMA)

Gunakan environment variables (.env) di Next.js untuk mengubah tema secara otomatis.

BASE Edition (NEXT_PUBLIC_CHAIN=base)

Tema UI: Biru Coinbase, Playful, Rounded.

Kubu yang Diadu: Komunitas Farcaster (Contoh: $DEGEN vs $HIGHER).

Narasi: "Social On-Chain Summer. Dukung komunitasmu tanpa risiko kehilangan uang."

MONAD Edition (NEXT_PUBLIC_CHAIN=monad)

Tema UI: Ungu, Neon, Cyberpunk/Speed.

Kubu yang Diadu: Arah harga Market dalam 5 menit (Contoh: ETH Up vs ETH Down).

Narasi: "Micro-Yield Wars. Memanfaatkan kecepatan eksekusi Monad untuk taruhan DeFi frekuensi tinggi."

CELO Edition (NEXT_PUBLIC_CHAIN=celo)

Tema UI: Hijau Bumi, Clean, Awwwards Minimalist.

Kubu yang Diadu: Donasi Sosial (Contoh: Tanam Mangrove vs Bersih Pantai).

Narasi: "Lossless Charity (ReFi). Yield dari pemenang otomatis disumbangkan ke yayasan yang didukung."

3. 🕹️ SUNTIKAN GAMEFI (THE DEGEN ANGLE)

Untuk mengubah dApp ini dari "alat finansial" menjadi "game adiktif", kita tambahkan mekanik berikut (pilih 1 atau implementasi keduanya jika waktu cukup):

A. "Victory Crates" (Mekanik Lootbox/Gacha)

Konsep: Saat kubu kamu menang, kamu tidak mendapatkan yield dalam bentuk angka saldo yang membosankan. Kamu mendapatkan NFT berupa "Victory Crate".

Dopamin: User harus mengklik kotak tersebut (dengan animasi ledakan/partikel yang heboh menggunakan Framer Motion). Di dalamnya berisi:

90% chance: Yield MON normal kamu.

9% chance: Yield MON + Token Eksklusif/Memecoin.

1% chance: Jackpot (NFT SSR, Badge khusus, atau multiplier).

Kenapa Jenius? User merasakan thrill dari judi (Gacha) tanpa pernah keluar uang sepeserpun untuk beli tiketnya, karena yang dipakai adalah bunga (yield) hasil kemenangan.

B. "Arena Power-Ups" (Mekanik RPG)

Konsep: Setiap kali user stake (deposit) di awal waktu, mereka dapat "Mana" secara off-chain (simpan di database Supabase).

Kegunaan: "Mana" bisa dihabiskan untuk membeli Power-Ups yang berdampak visual di Arena (Frontend):

Illusion (Cost: 50 Mana): Memalsukan bar indikator "Tarik Tambang" agar terlihat condong ke kubumu selama 10 menit (nge-troll kubu lawan biar panik).

Whale Shout (Cost: 100 Mana): Mengirimkan emoji raksasa animasi ke layar semua orang yang sedang menonton Arena secara real-time.

4. ARCHITECTURE & TECH STACK (FE/BE COMBINED)

Karena kamu menggabungkan FE dan BE untuk mempercepat development, ini adalah stack idealnya:

Framework: Next.js 14/15 (App Router). Server Actions digunakan sebagai "Backend" untuk validasi atau interaksi dengan DB.

Smart Contracts: Solidity (Foundry/Hardhat) + Wagmi / Viem di sisi client.

Styling & UI: Tailwind CSS + Framer Motion (SANGAT PENTING untuk animasi Tarik Tambang dan animasi Buka Gacha).

Auth: Privy atau Coinbase Smart Wallet (Account Abstraction agar user langsung masuk).

Database: Supabase (Sangat dianjurkan untuk sinkronisasi chat, real-time power-ups, dan nyimpen inventory Lootbox user).

5. UI/UX GUIDELINES (AWWWARDS STYLE)

Saat mencari inspirasi di Awwwards, cari desain dengan keyword: Split Screen, Brutalism, atau Interactive Drag.

Halaman Utama (Single Page App):

Hero Section: Judul raksasa (Typography-heavy). Penjelasan simpel: "Choose a side. Win the yield. Keep your money."

The Arena (Core Visual): * Layar terbelah dua (Kiri Merah/Kanan Biru).

Di tengah ada "Tali" atau "Progress Bar" raksasa yang posisinya berubah secara dinamis berdasarkan TVL. Tambahkan efek glow atau petir kalau ada yang pake Power-Up.

Action Panel:

Input amount (MON).

Tombol "Stake Side A" / "Stake Side B".

Inventory & Loot (GameFi Tab): * Sebuah drawer/modal di bawah layar tempat user melihat kotak-kotak "Victory Crates" mereka yang belum dibuka.

6. SMART CONTRACT LOGIC (THE MVP)

Jangan bikin sistem lending sungguhan kalau cuma 3 hari. Buat Mock Contract.

Variabel Utama:

poolA_TVL, poolB_TVL

totalMockYield (Angka yang bertambah seiring berjalannya block/waktu).

mapping(address => UserDeposit)

Fungsi Utama:

deposit(uint side, uint amount): User setor dana.

resolve(uint winningSide): Hanya bisa dipanggil owner. Mengunci pool dan menetapkan pemenang.

claim(): User menarik dana. Jika menang, dia tidak di-transfer yield, tapi di- mint sebuah NFT "Victory Crate". Jika kalah, ditarik normal.

7. STARTER PROMPTS (COPY-PASTE INI KE AI SAAT NGODING)

Gunakan prompt di bawah ini secara berurutan saat kamu mulai ngoding untuk meng-generate base code-nya.

Prompt 1: Smart Contract Foundation

"Buatkan saya Smart Contract Solidity bernama TarikVault.sol. Contract ini adalah platform 'Lossless Prediction'. User bisa deposit native MON ke Side 1 atau Side 2 dengan payable transaction. Contract memiliki variabel mockYield yang bertambah nilainya untuk mensimulasikan bunga DeFi. Buatkan fungsi resolve(uint8 winningSide) khusus owner. Lalu buat fungsi claim(): jika user berada di winningSide, modalnya kembali 100% ditambah dia di-mint token ERC1155 (sebagai Victory Crate). Jika kalah, dia hanya dapat modal awal saja kembali. Pastikan kodenya aman dari reentrancy."

Prompt 2: Next.js + Wagmi Setup & Theming

"Saya punya project Next.js App Router dengan Tailwind dan Wagmi. Buatkan sistem Dynamic Theming menggunakan CSS Variables di globals.css dan sebuah ThemeProvider. Temanya diatur via process.env.NEXT_PUBLIC_CHAIN.
Jika 'base', primary colornya biru (#0052FF).
Jika 'monad', primary colornya ungu (#836EFB).
Jika 'celo', primary colornya hijau (#35D07F).
Berikan juga contoh file layout.tsx yang mengaplikasikan tema ini."

Prompt 3: The "Tug-of-War" UI Component (The Masterpiece)

"Buatkan komponen React (Next.js client component) bernama TugOfWarArena.tsx. Gunakan Tailwind CSS dan Framer Motion. Komponen ini menerima props tvlA dan tvlB.
Visualnya adalah sebuah bar horizontal besar yang merepresentasikan 100% total TVL.
Beri warna solid untuk bagian A (menggunakan warna tema primer) dan bagian B (warna sekunder/abu-abu).
Titik temu (persentase) antara A dan B harus bergeser secara mulus (smooth animated layout) menggunakan Framer Motion ketika nilai tvlA atau tvlB berubah. Di tengah-tengah titik temu itu, letakkan sebuah ikon elemen yang seolah-olah ditarik ke kiri atau kanan."

Prompt 4: The GameFi Lootbox Component (Gacha Animation)

"Buatkan komponen React bernama VictoryCrate.tsx menggunakan Framer Motion. Komponen ini menampilkan gambar sebuah peti harta karun tertutup. Ketika di-klik, buat animasi bergetar (shake) yang intens selama 2 detik, layaknya game Gacha, lalu peti terbuka memancarkan cahaya (glow/scale-up) dan menampilkan teks hasil hadiah acak (contoh: '+50 MON Yield' atau 'SSR MFER NFT')."
