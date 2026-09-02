; Skrip NSIS kustom. electron-builder menyertakan berkas ini otomatis kalau ada
; di build/installer.nsh -- tidak perlu diaktifkan dari electron-builder.yml.

!macro customInstall
  ; ---------------------------------------------------------------------------
  ; Auto-start Windows hidup di HKCU\...\Run, dan nilainya adalah JALUR LENGKAP
  ; ke berkas .exe. Saat rebrand, executableName berubah dari bsim menjadi nnim
  ; sementara folder pemasangan tetap, sehingga entri lama menunjuk berkas yang
  ; sudah lenyap. Windows gagal menjalankannya tanpa satu pun pesan.
  ;
  ; Perbaikan di sisi aplikasi (menegaskan ulang jalur setiap start) hanya
  ; bekerja SETELAH aplikasi dibuka -- dan yang rusak justru mekanisme yang
  ; membukanya. Pemasang memutus lingkaran itu: ia selalu dijalankan.
  ;
  ; HANYA MEMPERBAIKI, TIDAK PERNAH MEMBUAT. Kalau entri tidak ada, itu bisa
  ; berarti pemasangan pertama (aplikasi akan mendaftarkan diri saat start
  ; pertama, seperti sebelumnya) ATAU pengguna sengaja mematikannya. Pemasang
  ; tidak berhak menebak yang mana, jadi ia diam.
  ; ---------------------------------------------------------------------------
  ClearErrors
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.bsi.messenger"
  IfErrors nnim_autostart_selesai 0
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "com.bsi.messenger" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'
  nnim_autostart_selesai:
!macroend
