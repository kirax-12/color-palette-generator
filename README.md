# Color Palette Generator

Generator palet warna harmonis berbasis teori warna — bukan asal acak. Satu klik (atau satu pencetan spasi) menghasilkan 5 warna yang saling nyambung, lengkap dengan kode HEX dan RGB-nya.

**[Lihat kode di GitHub](https://github.com/kirax-12/color-palette-generator)**

## Fitur

- **5 skema harmonis** — Analogous, Komplementer, Triadic, Pastel, dan Vibrant. Semua diturunkan dari satu hue dasar di ruang warna HSL dengan pola offset hue, saturasi, dan lightness per skema. Ada juga mode **Acak** yang berganti skema tiap generate.
- **Kunci warna** — warna yang sudah sreg bisa dikunci; saat generate ulang, hanya warna yang tidak terkunci yang diganti.
- **Salin sekali klik** — tombol Salin di tiap warna menyalin kode HEX (dengan feedback "Tersalin!"), dan tombol **Salin CSS** menyalin variabel `:root { --warna-1: ...; }` siap tempel ke stylesheet.
- **Shortcut spasi** — tekan spasi di mana saja untuk generate palet baru (otomatis nonaktif saat fokus sedang di input, select, atau tombol).
- **Riwayat palet** — 8 palet terakhir disimpan sebagai strip warna, klik untuk memakai lagi. Tersimpan di `localStorage` (kunci `palette-history-v1`), jadi masih ada setelah halaman ditutup.
- **Responsif** — di desktop palet tampil sebagai 5 kolom warna full-bleed; di HP berubah jadi baris-baris bertumpuk.

## Cara menjalankan

Tidak ada build step dan tidak ada server. Cukup buka `index.html` di browser modern — atau aktifkan GitHub Pages dari repo ini untuk versi online-nya.

## Teknologi

- HTML, CSS, dan JavaScript murni (vanilla), tanpa framework dan tanpa library eksternal selain Google Fonts.
- Konversi warna HSL ↔ HEX ditulis manual; clipboard memakai Clipboard API dengan fallback `execCommand`.
- Gaya visual mengikuti Remike Web Style: krem `#FFF8EC`, border tinta 2px, bayangan offset keras, aksen flat, font Space Grotesk + Space Mono + Caveat.

Dibuat oleh Remike Dev.
