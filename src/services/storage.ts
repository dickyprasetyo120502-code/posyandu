import type { 
  IbuHamil, 
  Balita, 
  ImunisasiRecord, 
  PertumbuhanRecord, 
  UserSession, 
  PemeriksaanKehamilan,
  JadwalPosyandu
} from '../types';

const STORAGE_KEYS = {
  IBU_HAMIL: 'posyandu_ibu_hamil_data',
  BALITA: 'posyandu_balita_data',
  IMUNISASI: 'posyandu_imunisasi_data',
  PERTUMBUHAN: 'posyandu_pertumbuhan_data',
  JADWAL: 'posyandu_jadwal_data',
  SESSION: 'posyandu_active_session',
};

// Safe JSON parser helper
function getStoredArray<T>(key: string): T[] {
  try {
    const item = localStorage.getItem(key);
    if (!item) return [];
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Gagal membaca ${key} dari LocalStorage:`, error);
    return [];
  }
}

function setStoredArray<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Gagal menyimpan ${key} ke LocalStorage:`, error);
  }
}

// ================= STORAGE SERVICE =================
export const storageService = {
  // Session
  getSession(): UserSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSession(session: UserSession): void {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // ================= VERIFIKASI NIK WARGA TERDAFTAR =================
  findRegisteredWargaByNik(nik: string): { registered: boolean; name: string } {
    const clean = nik.trim();
    if (!clean) return { registered: false, name: '' };
    const ibuList = this.getIbuHamil();
    const balitaList = this.getBalita();

    // 1. Cek di daftar Ibu Hamil
    const ibu = ibuList.find((i) => i.nik.trim() === clean);
    if (ibu) {
      return { registered: true, name: ibu.nama };
    }

    // 2. Cek di daftar Balita (apakah NIK tersebut adalah NIK Ibu dari balita)
    const balitaByIbu = balitaList.find((b) => b.nikIbu && b.nikIbu.trim() === clean);
    if (balitaByIbu) {
      return { registered: true, name: balitaByIbu.namaIbu || `Orang Tua (${balitaByIbu.nama})` };
    }

    // 3. Cek di daftar Balita (apakah NIK balita itu sendiri)
    const balitaSelf = balitaList.find((b) => b.nik && b.nik.trim() === clean);
    if (balitaSelf) {
      return { registered: true, name: balitaSelf.nama };
    }

    return { registered: false, name: '' };
  },

  // ================= JADWAL POSYANDU (SINKRON DENGAN WARGA) =================
  getJadwal(): JadwalPosyandu[] {
    return getStoredArray<JadwalPosyandu>(STORAGE_KEYS.JADWAL);
  },

  saveJadwal(data: Omit<JadwalPosyandu, 'id' | 'createdAt'> & { id?: string }): JadwalPosyandu {
    const list = this.getJadwal();
    let savedItem: JadwalPosyandu;

    if (data.id) {
      const existing = list.find((j) => j.id === data.id);
      savedItem = {
        ...data,
        id: data.id,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      const updated = list.map((j) => (j.id === data.id ? savedItem : j));
      setStoredArray(STORAGE_KEYS.JADWAL, updated);
    } else {
      savedItem = {
        ...data,
        id: 'JDW-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setStoredArray(STORAGE_KEYS.JADWAL, [savedItem, ...list]);
    }
    return savedItem;
  },

  deleteJadwal(id: string): void {
    const list = this.getJadwal().filter((j) => j.id !== id);
    setStoredArray(STORAGE_KEYS.JADWAL, list);
  },

  // ================= IBU HAMIL (Mulai dari 0) =================
  getIbuHamil(): IbuHamil[] {
    return getStoredArray<IbuHamil>(STORAGE_KEYS.IBU_HAMIL);
  },

  getIbuHamilByNik(nik: string): IbuHamil | undefined {
    const list = this.getIbuHamil();
    return list.find((item) => item.nik.trim() === nik.trim());
  },

  saveIbuHamil(data: Omit<IbuHamil, 'id' | 'createdAt' | 'riwayatPemeriksaan'> & { id?: string }): IbuHamil {
    const list = this.getIbuHamil();

    // Validasi NIK Unik
    const duplicateNik = list.find(
      (item) => item.nik.trim() === data.nik.trim() && item.id !== data.id
    );
    if (duplicateNik) {
      throw new Error(`NIK ${data.nik} sudah terdaftar atas nama Ibu "${duplicateNik.nama}"! Gunakan NIK yang berbeda.`);
    }

    let savedItem: IbuHamil;

    if (data.id) {
      const existing = list.find((i) => i.id === data.id);
      savedItem = {
        ...data,
        id: data.id,
        createdAt: existing?.createdAt || new Date().toISOString(),
        riwayatPemeriksaan: existing?.riwayatPemeriksaan || [],
      };
      const updatedList = list.map((i) => (i.id === data.id ? savedItem : i));
      setStoredArray(STORAGE_KEYS.IBU_HAMIL, updatedList);
    } else {
      savedItem = {
        ...data,
        id: 'IBU-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
        riwayatPemeriksaan: [],
      };
      setStoredArray(STORAGE_KEYS.IBU_HAMIL, [savedItem, ...list]);
    }
    return savedItem;
  },

  addPemeriksaanIbuHamil(ibuId: string, pemeriksaan: Omit<PemeriksaanKehamilan, 'id'>): boolean {
    const list = this.getIbuHamil();
    const target = list.find((i) => i.id === ibuId);
    if (!target) return false;

    const newPemeriksaan: PemeriksaanKehamilan = {
      ...pemeriksaan,
      id: 'PEM-' + Date.now(),
    };

    target.riwayatPemeriksaan = [newPemeriksaan, ...(target.riwayatPemeriksaan || [])];
    setStoredArray(STORAGE_KEYS.IBU_HAMIL, list);
    return true;
  },

  deleteIbuHamil(id: string): void {
    const list = this.getIbuHamil().filter((i) => i.id !== id);
    setStoredArray(STORAGE_KEYS.IBU_HAMIL, list);
  },

  // ================= BALITA (Mulai dari 0, NIK Opsional) =================
  getBalita(): Balita[] {
    return getStoredArray<Balita>(STORAGE_KEYS.BALITA);
  },

  getBalitaByNik(nik: string): Balita | undefined {
    return this.getBalita().find((b) => b.nik && b.nik.trim() === nik.trim());
  },

  getBalitaByIbuNik(nikIbu: string): Balita[] {
    return this.getBalita().filter((b) => b.nikIbu && b.nikIbu.trim() === nikIbu.trim());
  },

  saveBalita(data: Omit<Balita, 'id' | 'createdAt'> & { id?: string }): Balita {
    const list = this.getBalita();

    const cleanNik = data.nik ? data.nik.trim() : '';
    const cleanNikIbu = data.nikIbu ? data.nikIbu.trim() : '';

    if (cleanNik && cleanNik !== '-' && !cleanNik.startsWith('BAYI-')) {
      const duplicateNik = list.find(
        (b) => b.nik && b.nik.trim() === cleanNik && b.id !== data.id
      );
      if (duplicateNik) {
        // Jika dalam 1 keluarga (nikIbu sama atau memakai NIK orang tua), izinkan karena 1 keluarga bisa punya 2+ anak
        const sameFamily = 
          (cleanNikIbu && duplicateNik.nikIbu && duplicateNik.nikIbu.trim() === cleanNikIbu) ||
          (cleanNikIbu && cleanNik === cleanNikIbu);
        
        if (!sameFamily) {
          throw new Error(`NIK ${cleanNik} sudah terdaftar atas nama balita "${duplicateNik.nama}". Jika dalam 1 keluarga, pastikan NIK Ibu diisi sama.`);
        }
      }
    }

    const finalNik = cleanNik || `BAYI-${Date.now().toString().slice(-6)}`;

    let savedItem: Balita;

    if (data.id) {
      const existing = list.find((b) => b.id === data.id);
      savedItem = {
        ...data,
        nik: finalNik,
        id: data.id,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      const updatedList = list.map((b) => (b.id === data.id ? savedItem : b));
      setStoredArray(STORAGE_KEYS.BALITA, updatedList);
    } else {
      savedItem = {
        ...data,
        nik: finalNik,
        id: 'BALITA-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
      };
      setStoredArray(STORAGE_KEYS.BALITA, [savedItem, ...list]);
    }
    return savedItem;
  },

  deleteBalita(id: string): void {
    const list = this.getBalita().filter((b) => b.id !== id);
    setStoredArray(STORAGE_KEYS.BALITA, list);
    const imunisasi = this.getImunisasi().filter((i) => i.balitaId !== id);
    setStoredArray(STORAGE_KEYS.IMUNISASI, imunisasi);
    const pertumbuhan = this.getPertumbuhan().filter((p) => p.balitaId !== id);
    setStoredArray(STORAGE_KEYS.PERTUMBUHAN, pertumbuhan);
  },

  // ================= IMUNISASI =================
  getImunisasi(): ImunisasiRecord[] {
    return getStoredArray<ImunisasiRecord>(STORAGE_KEYS.IMUNISASI);
  },

  getImunisasiByBalita(balitaId: string): ImunisasiRecord[] {
    return this.getImunisasi().filter((i) => i.balitaId === balitaId);
  },

  saveImunisasi(data: Omit<ImunisasiRecord, 'id'>): ImunisasiRecord {
    const list = this.getImunisasi();
    const newRecord: ImunisasiRecord = {
      ...data,
      id: 'IMU-' + Date.now(),
    };
    setStoredArray(STORAGE_KEYS.IMUNISASI, [newRecord, ...list]);
    return newRecord;
  },

  deleteImunisasi(id: string): void {
    const list = this.getImunisasi().filter((i) => i.id !== id);
    setStoredArray(STORAGE_KEYS.IMUNISASI, list);
  },

  // ================= PERTUMBUHAN =================
  getPertumbuhan(): PertumbuhanRecord[] {
    return getStoredArray<PertumbuhanRecord>(STORAGE_KEYS.PERTUMBUHAN);
  },

  getPertumbuhanByBalita(balitaId: string): PertumbuhanRecord[] {
    return this.getPertumbuhan().filter((p) => p.balitaId === balitaId);
  },

  savePertumbuhan(data: Omit<PertumbuhanRecord, 'id'>): PertumbuhanRecord {
    const list = this.getPertumbuhan();
    const newRecord: PertumbuhanRecord = {
      ...data,
      id: 'TUMB-' + Date.now(),
    };
    setStoredArray(STORAGE_KEYS.PERTUMBUHAN, [newRecord, ...list]);
    return newRecord;
  },

  deletePertumbuhan(id: string): void {
    const list = this.getPertumbuhan().filter((p) => p.id !== id);
    setStoredArray(STORAGE_KEYS.PERTUMBUHAN, list);
  },

  // ================= BACKUP & RESTORE =================
  exportBackup(): string {
    const backupData = {
      ibuHamil: this.getIbuHamil(),
      balita: this.getBalita(),
      imunisasi: this.getImunisasi(),
      pertumbuhan: this.getPertumbuhan(),
      jadwal: this.getJadwal(),
      exportedAt: new Date().toISOString(),
      version: '1.1',
    };
    return JSON.stringify(backupData, null, 2);
  },

  importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.ibuHamil)) setStoredArray(STORAGE_KEYS.IBU_HAMIL, parsed.ibuHamil);
      if (Array.isArray(parsed.balita)) setStoredArray(STORAGE_KEYS.BALITA, parsed.balita);
      if (Array.isArray(parsed.imunisasi)) setStoredArray(STORAGE_KEYS.IMUNISASI, parsed.imunisasi);
      if (Array.isArray(parsed.pertumbuhan)) setStoredArray(STORAGE_KEYS.PERTUMBUHAN, parsed.pertumbuhan);
      if (Array.isArray(parsed.jadwal)) setStoredArray(STORAGE_KEYS.JADWAL, parsed.jadwal);
      return { success: true, message: 'Data cadangan Posyandu berhasil dipulihkan!' };
    } catch {
      return { success: false, message: 'Format data JSON tidak valid atau rusak.' };
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.IBU_HAMIL);
    localStorage.removeItem(STORAGE_KEYS.BALITA);
    localStorage.removeItem(STORAGE_KEYS.IMUNISASI);
    localStorage.removeItem(STORAGE_KEYS.PERTUMBUHAN);
    localStorage.removeItem(STORAGE_KEYS.JADWAL);
  },
};

// ================= HPL & USIA KEHAMILAN HELPER =================
export interface PregnancyInfo {
  hplDateFormatted: string;
  hplDateISO: string;
  gestationalWeeks: number;
  gestationalDays: number;
  daysRemaining: number;
  trimester: 1 | 2 | 3;
  progressPercent: number;
  statusDesc: string;
}

export function hitungHPLdanUsiaKehamilan(hphtString: string): PregnancyInfo | null {
  if (!hphtString) return null;
  const hpht = new Date(hphtString);
  if (isNaN(hpht.getTime())) return null;

  const hplTimestamp = hpht.getTime() + 280 * 24 * 60 * 60 * 1000;
  const hplDate = new Date(hplTimestamp);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTimeSinceHpht = today.getTime() - hpht.getTime();
  const totalDaysPregnant = Math.max(0, Math.floor(diffTimeSinceHpht / (24 * 60 * 60 * 1000)));

  const gestationalWeeks = Math.floor(totalDaysPregnant / 7);
  const gestationalDays = totalDaysPregnant % 7;

  const diffTimeToHpl = hplTimestamp - today.getTime();
  const daysRemaining = Math.ceil(diffTimeToHpl / (24 * 60 * 60 * 1000));

  let trimester: 1 | 2 | 3 = 1;
  let statusDesc = 'Trimester 1 (Pembentukan Organ)';
  if (gestationalWeeks >= 28) {
    trimester = 3;
    statusDesc = daysRemaining <= 14 ? 'Siap Melahirkan (Aterm)' : 'Trimester 3 (Persiapan Persalinan)';
  } else if (gestationalWeeks >= 13) {
    trimester = 2;
    statusDesc = 'Trimester 2 (Masa Pertumbuhan)';
  }

  const progressPercent = Math.min(100, Math.max(0, Math.round((totalDaysPregnant / 280) * 100)));

  const hplDateFormatted = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
  }).format(hplDate);

  const hplDateISO = hplDate.toISOString().split('T')[0];

  return {
    hplDateFormatted,
    hplDateISO,
    gestationalWeeks,
    gestationalDays,
    daysRemaining,
    trimester,
    progressPercent,
    statusDesc,
  };
}

export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function hitungUsiaBulan(tanggalLahir: string): number {
  if (!tanggalLahir) return 0;
  const birth = new Date(tanggalLahir);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) {
    months--;
  }
  return Math.max(0, months);
}
