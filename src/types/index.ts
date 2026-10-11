export type UserRole = 'admin' | 'kader' | 'warga';

export interface UserSession {
  role: UserRole;
  name: string;
  username?: string;
  nik?: string;
}

export interface JadwalPosyandu {
  id: string;
  judul: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // e.g. "08:30 - 11:30 WIB"
  lokasi: string;
  kategori: 'Semua' | 'Ibu Hamil' | 'Balita & Imunisasi';
  keterangan: string;
  petugas: string;
  createdAt: string;
}

export interface PemeriksaanKehamilan {
  id: string;
  tanggal: string;
  usiaKehamilanMinggu: number;
  beratBadanKg: number;
  tekananDarah: string;
  tinggiFundusCm?: number;
  djj?: number; // Denyut Jantung Janin (bpm)
  keluhan: string;
  tindakan: string;
  kaderPencatat: string;
}

export interface IbuHamil {
  id: string;
  nik: string; // 16 digit NIK
  nama: string;
  tanggalLahir: string;
  usia: number;
  namaSuami: string;
  noHp: string;
  alamat: string;
  hpht: string; // Hari Pertama Haid Terakhir (YYYY-MM-DD)
  hpl: string;  // Hari Perkiraan Lahir (YYYY-MM-DD)
  gravida: number; // Kehamilan ke-
  paritas: number; // Jumlah persalinan
  abortus: number; // Jumlah keguguran
  lila: number;    // Lingkar Lengan Atas (cm)
  statusResiko: 'Rendah' | 'Tinggi' | 'Sangat Tinggi';
  catatanResiko: string;
  riwayatPemeriksaan: PemeriksaanKehamilan[];
  createdAt: string;
}

export interface ImunisasiRecord {
  id: string;
  balitaId: string;
  nikBalita?: string;
  namaBalita: string;
  jenisVaksin: string;
  tanggalDiberikan: string;
  usiaBulanSaatDiberikan: number;
  kaderPemberi: string;
  catatan?: string;
}

export interface PertumbuhanRecord {
  id: string;
  balitaId: string;
  tanggal: string;
  usiaBulan: number;
  beratBadanKg: number;
  tinggiBadanCm: number;
  lingkarKepalaCm: number;
  lingkarDadaCm?: number;
  statusGizi: 'Gizi Baik' | 'Gizi Kurang' | 'Gizi Lebih' | 'Beresiko Stunting';
  vitaminA: boolean;
  obatCacing: boolean;
  kaderPencatat: string;
}

export interface Balita {
  id: string;
  nik?: string; // NIK Balita (Opsional)
  nama: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  namaIbu: string;
  nikIbu?: string;
  namaAyah: string;
  beratLahirKg: number;
  panjangLahirCm: number;
  alamat: string;
  noHp: string;
  createdAt: string;
}

// Rekomendasi Vaksin Nasional Kemenkes RI
export interface MasterVaksin {
  kode: string;
  nama: string;
  usiaBulan: number;
  deskripsi: string;
  wajib: boolean;
}

export const JADWAL_VAKSIN_KEMENKES: MasterVaksin[] = [
  { kode: 'HB-0', nama: 'Hepatitis B (HB-0)', usiaBulan: 0, deskripsi: 'Diberikan segera setelah lahir (< 24 jam)', wajib: true },
  { kode: 'BCG', nama: 'BCG', usiaBulan: 1, deskripsi: 'Mencegah Tuberkulosis (TBC)', wajib: true },
  { kode: 'POLIO-1', nama: 'Polio Tetes 1 (bOPV 1)', usiaBulan: 1, deskripsi: 'Mencegah kelumpuhan akibat polio', wajib: true },
  { kode: 'DPT-1', nama: 'DPT-HB-Hib 1', usiaBulan: 2, deskripsi: 'Mencegah Difteri, Pertusis, Tetanus, Hep B, Hib', wajib: true },
  { kode: 'POLIO-2', nama: 'Polio Tetes 2 (bOPV 2)', usiaBulan: 2, deskripsi: 'Dosis kedua Polio tetes', wajib: true },
  { kode: 'PCV-1', nama: 'PCV 1', usiaBulan: 2, deskripsi: 'Mencegah radang paru (pneumonia)', wajib: true },
  { kode: 'ROTA-1', nama: 'Rotavirus 1', usiaBulan: 2, deskripsi: 'Mencegah diare berat rotavirus', wajib: false },
  { kode: 'DPT-2', nama: 'DPT-HB-Hib 2', usiaBulan: 3, deskripsi: 'Dosis ketiga DPT-HB-Hib', wajib: true },
  { kode: 'POLIO-3', nama: 'Polio Tetes 3 (bOPV 3)', usiaBulan: 3, deskripsi: 'Dosis ketiga Polio tetes', wajib: true },
  { kode: 'PCV-2', nama: 'PCV 2', usiaBulan: 3, deskripsi: 'Dosis kedua pneumonia', wajib: true },
  { kode: 'ROTA-2', nama: 'Rotavirus 2', usiaBulan: 3, deskripsi: 'Dosis kedua diare rotavirus', wajib: false },
  { kode: 'DPT-3', nama: 'DPT-HB-Hib 3', usiaBulan: 4, deskripsi: 'Dosis penutup DPT dasar', wajib: true },
  { kode: 'POLIO-4', nama: 'Polio Tetes 4 (bOPV 4)', usiaBulan: 4, deskripsi: 'Dosis penutup Polio tetes', wajib: true },
  { kode: 'IPV-1', nama: 'IPV 1 (Polio Suntik)', usiaBulan: 4, deskripsi: 'Inactivated Polio Vaccine suntik', wajib: true },
  { kode: 'MR-1', nama: 'Campak-Rubella (MR 1)', usiaBulan: 9, deskripsi: 'Mencegah Campak dan Campak Jerman', wajib: true },
  { kode: 'IPV-2', nama: 'IPV 2 (Polio Suntik 2)', usiaBulan: 9, deskripsi: 'Dosis suntik kedua Polio', wajib: true },
  { kode: 'PCV-3', nama: 'PCV 3 (Lanjutan)', usiaBulan: 12, deskripsi: 'Booster pneumonia usia 1 tahun', wajib: true },
  { kode: 'DPT-BOOSTER', nama: 'DPT-HB-Hib Lanjutan (Booster)', usiaBulan: 18, deskripsi: 'Booster kekebalan anak batita', wajib: true },
  { kode: 'MR-BOOSTER', nama: 'Campak-Rubella Lanjutan (MR 2)', usiaBulan: 18, deskripsi: 'Booster kekebalan campak', wajib: true },
];
