-- ====================================================================
-- DATABASE SCHEMA: POSYANDU DIGITAL TERPADU
-- Dialect: SQLite / MySQL Compatible DDL
-- Dibuat untuk Sistem Manajemen Posyandu (Ibu Hamil, Balita, & Imunisasi)
-- ====================================================================

-- 1. TABEL PENGGUNA & AUTENTIKASI
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'kader', 'warga')),
    nik VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL IBU HAMIL
CREATE TABLE IF NOT EXISTS ibu_hamil (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    tanggal_lahir DATE,
    usia INTEGER,
    nama_suami VARCHAR(100),
    no_hp VARCHAR(25),
    alamat TEXT,
    hpht DATE,
    hpl DATE,
    gravida INTEGER DEFAULT 1,
    paritas INTEGER DEFAULT 0,
    abortus INTEGER DEFAULT 0,
    lila REAL DEFAULT 0,
    status_resiko VARCHAR(30) DEFAULT 'Rendah',
    catatan_resiko TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL RIWAYAT PEMERIKSAAN KEHAMILAN (ANC)
CREATE TABLE IF NOT EXISTS pemeriksaan_kehamilan (
    id VARCHAR(50) PRIMARY KEY,
    ibu_hamil_id VARCHAR(50) NOT NULL,
    tanggal DATE NOT NULL,
    usia_kehamilan_minggu INTEGER,
    berat_badan_kg REAL,
    tekanan_darah VARCHAR(20),
    tinggi_fundus_cm REAL,
    djj INTEGER,
    keluhan TEXT,
    tindakan TEXT,
    kader_pencatat VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ibu_hamil_id) REFERENCES ibu_hamil(id) ON DELETE CASCADE
);

-- 4. TABEL BALITA & ANAK
CREATE TABLE IF NOT EXISTS balita (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(20),
    nama VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(2) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
    nama_ibu VARCHAR(100),
    nik_ibu VARCHAR(20),
    nama_ayah VARCHAR(100),
    berat_lahir_kg REAL DEFAULT 0,
    panjang_lahir_cm REAL DEFAULT 0,
    alamat TEXT,
    no_hp VARCHAR(25),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL CATATAN IMUNISASI BALITA
CREATE TABLE IF NOT EXISTS imunisasi (
    id VARCHAR(50) PRIMARY KEY,
    balita_id VARCHAR(50) NOT NULL,
    nik_balita VARCHAR(20),
    nama_balita VARCHAR(100) NOT NULL,
    jenis_vaksin VARCHAR(100) NOT NULL,
    tanggal_diberikan DATE NOT NULL,
    usia_bulan_saat_diberikan INTEGER,
    kader_pemberi VARCHAR(100),
    catatan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (balita_id) REFERENCES balita(id) ON DELETE CASCADE
);

-- 6. TABEL CATATAN PERTUMBUHAN BALITA (KMS)
CREATE TABLE IF NOT EXISTS pertumbuhan (
    id VARCHAR(50) PRIMARY KEY,
    balita_id VARCHAR(50) NOT NULL,
    tanggal DATE NOT NULL,
    usia_bulan INTEGER,
    berat_badan_kg REAL NOT NULL,
    tinggi_badan_cm REAL NOT NULL,
    lingkar_kepala_cm REAL NOT NULL,
    lingkar_dada_cm REAL,
    status_gizi VARCHAR(50),
    vitamin_a INTEGER DEFAULT 0, -- 0: Tidak, 1: Ya
    obat_cacing INTEGER DEFAULT 0, -- 0: Tidak, 1: Ya
    kader_pencatat VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (balita_id) REFERENCES balita(id) ON DELETE CASCADE
);

-- 7. TABEL JADWAL KEGIATAN POSYANDU
CREATE TABLE IF NOT EXISTS jadwal_posyandu (
    id VARCHAR(50) PRIMARY KEY,
    judul VARCHAR(150) NOT NULL,
    tanggal DATE NOT NULL,
    waktu VARCHAR(50) NOT NULL,
    lokasi VARCHAR(150) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    keterangan TEXT,
    petugas VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABEL MASTER VAKSIN NASIONAL (KEMENKES RI)
CREATE TABLE IF NOT EXISTS master_vaksin (
    kode VARCHAR(30) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    usia_bulan INTEGER NOT NULL,
    deskripsi TEXT,
    wajib INTEGER DEFAULT 1 -- 0: Tidak, 1: Ya
);

-- ====================================================================
-- INDEKS UNTUK PENCARIAN & PERFORMA CEPAT
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_ibu_nik ON ibu_hamil(nik);
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_ibu ON pemeriksaan_kehamilan(ibu_hamil_id);
CREATE INDEX IF NOT EXISTS idx_balita_nik ON balita(nik);
CREATE INDEX IF NOT EXISTS idx_balita_nik_ibu ON balita(nik_ibu);
CREATE INDEX IF NOT EXISTS idx_imunisasi_balita ON imunisasi(balita_id);
CREATE INDEX IF NOT EXISTS idx_pertumbuhan_balita ON pertumbuhan(balita_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_posyandu(tanggal);

-- ====================================================================
-- SEED DATA AWAL: PETUGAS & MASTER VAKSIN
-- ====================================================================
INSERT OR IGNORE INTO users (id, username, password, name, role) VALUES 
('USR-ADMIN-1', 'admin', 'admin123', 'Administrator Posyandu', 'admin'),
('USR-KADER-1', 'kader', 'kader123', 'Kader Posyandu Desa', 'kader');

INSERT OR IGNORE INTO master_vaksin (kode, nama, usia_bulan, deskripsi, wajib) VALUES
('HB-0', 'Hepatitis B (HB-0)', 0, 'Diberikan segera setelah lahir (< 24 jam)', 1),
('BCG', 'BCG', 1, 'Mencegah Tuberkulosis (TBC)', 1),
('POLIO-1', 'Polio Tetes 1 (bOPV 1)', 1, 'Mencegah kelumpuhan akibat polio', 1),
('DPT-1', 'DPT-HB-Hib 1', 2, 'Mencegah Difteri, Pertusis, Tetanus, Hep B, Hib', 1),
('POLIO-2', 'Polio Tetes 2 (bOPV 2)', 2, 'Dosis kedua Polio tetes', 1),
('PCV-1', 'PCV 1', 2, 'Mencegah radang paru (pneumonia)', 1),
('ROTA-1', 'Rotavirus 1', 2, 'Mencegah diare berat rotavirus', 0),
('DPT-2', 'DPT-HB-Hib 2', 3, 'Dosis ketiga DPT-HB-Hib', 1),
('POLIO-3', 'Polio Tetes 3 (bOPV 3)', 3, 'Dosis ketiga Polio tetes', 1),
('PCV-2', 'PCV 2', 3, 'Dosis kedua pneumonia', 1),
('ROTA-2', 'Rotavirus 2', 3, 'Dosis kedua diare rotavirus', 0),
('DPT-3', 'DPT-HB-Hib 3', 4, 'Dosis penutup DPT dasar', 1),
('POLIO-4', 'Polio Tetes 4 (bOPV 4)', 4, 'Dosis penutup Polio tetes', 1),
('IPV-1', 'IPV 1 (Polio Suntik)', 4, 'Inactivated Polio Vaccine suntik', 1),
('MR-1', 'Campak-Rubella (MR 1)', 9, 'Mencegah Campak dan Campak Jerman', 1),
('IPV-2', 'IPV 2 (Polio Suntik 2)', 9, 'Dosis suntik kedua Polio', 1),
('PCV-3', 'PCV 3 (Lanjutan)', 12, 'Booster pneumonia usia 1 tahun', 1),
('DPT-BOOSTER', 'DPT-HB-Hib Lanjutan (Booster)', 18, 'Booster kekebalan anak batita', 1),
('MR-BOOSTER', 'Campak-Rubella Lanjutan (MR 2)', 18, 'Booster kekebalan campak', 1);
