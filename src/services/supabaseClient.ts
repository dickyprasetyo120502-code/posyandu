import type {
  IbuHamil,
  Balita,
  ImunisasiRecord,
  PertumbuhanRecord,
  JadwalPosyandu,
  PemeriksaanKehamilan,
  UserSession
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jujznyerkwsmrnutoigh.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GlnWhmasLlPLEPk8JN6bdA_IhKTXGHD';

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// Generic Supabase REST Fetcher
async function supabaseFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        ...HEADERS,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Supabase Error ${res.status}] ${endpoint}:`, errText);
      return null;
    }

    if (res.status === 204) return null; // No Content
    return await res.json();
  } catch (error) {
    console.warn(`[Supabase Connection Fail] ${endpoint}:`, error);
    return null;
  }
}

export const supabaseService = {
  // Cek Status Supabase Cloud
  async checkConnection(): Promise<boolean> {
    try {
      const res = await supabaseFetch<any[]>('master_vaksin?select=kode&limit=1');
      return Boolean(res && res.length >= 0);
    } catch {
      return false;
    }
  },

  // ================= 1. IBU HAMIL =================
  async getIbuHamil(): Promise<IbuHamil[] | null> {
    const [ibuRows, pemRows] = await Promise.all([
      supabaseFetch<any[]>('ibu_hamil?select=*&order=created_at.desc'),
      supabaseFetch<any[]>('pemeriksaan_kehamilan?select=*&order=tanggal.desc'),
    ]);

    if (!ibuRows) return null;

    const pemMap: Record<string, PemeriksaanKehamilan[]> = {};
    if (pemRows) {
      for (const p of pemRows) {
        if (!pemMap[p.ibu_hamil_id]) pemMap[p.ibu_hamil_id] = [];
        pemMap[p.ibu_hamil_id].push({
          id: p.id,
          tanggal: p.tanggal,
          usiaKehamilanMinggu: Number(p.usia_kehamilan_minggu || 0),
          beratBadanKg: Number(p.berat_badan_kg || 0),
          tekananDarah: p.tekanan_darah || '',
          tinggiFundusCm: p.tinggi_fundus_cm ? Number(p.tinggi_fundus_cm) : undefined,
          djj: p.djj ? Number(p.djj) : undefined,
          keluhan: p.keluhan || '',
          tindakan: p.tindakan || '',
          kaderPencatat: p.kader_pencatat || '',
        });
      }
    }

    return ibuRows.map((i) => ({
      id: i.id,
      nik: i.nik,
      nama: i.nama,
      tanggalLahir: i.tanggal_lahir,
      usia: Number(i.usia || 0),
      namaSuami: i.nama_suami || '',
      noHp: i.no_hp || '',
      alamat: i.alamat || '',
      hpht: i.hpht || '',
      hpl: i.hpl || '',
      gravida: Number(i.gravida || 1),
      paritas: Number(i.paritas || 0),
      abortus: Number(i.abortus || 0),
      lila: Number(i.lila || 0),
      statusResiko: i.status_resiko || 'Rendah',
      catatanResiko: i.catatan_resiko || '',
      riwayatPemeriksaan: pemMap[i.id] || [],
      createdAt: i.created_at || new Date().toISOString(),
    }));
  },

  async saveIbuHamil(data: IbuHamil): Promise<boolean> {
    const payload = {
      id: data.id,
      nik: data.nik.trim(),
      nama: data.nama,
      tanggal_lahir: data.tanggalLahir || null,
      usia: data.usia || 0,
      nama_suami: data.namaSuami || '',
      no_hp: data.noHp || '',
      alamat: data.alamat || '',
      hpht: data.hpht || null,
      hpl: data.hpl || null,
      gravida: data.gravida || 1,
      paritas: data.paritas || 0,
      abortus: data.abortus || 0,
      lila: data.lila || 0,
      status_resiko: data.statusResiko || 'Rendah',
      catatan_resiko: data.catatanResiko || '',
      created_at: data.createdAt || new Date().toISOString(),
    };

    // Upsert via POST with resolution
    const res = await supabaseFetch('ibu_hamil', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deleteIbuHamil(id: string): Promise<boolean> {
    const res = await supabaseFetch(`ibu_hamil?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  async addPemeriksaan(ibuId: string, p: PemeriksaanKehamilan): Promise<boolean> {
    const payload = {
      id: p.id,
      ibu_hamil_id: ibuId,
      tanggal: p.tanggal,
      usia_kehamilan_minggu: p.usiaKehamilanMinggu || 0,
      berat_badan_kg: p.beratBadanKg || 0,
      tekanan_darah: p.tekananDarah || '',
      tinggi_fundus_cm: p.tinggiFundusCm || null,
      djj: p.djj || null,
      keluhan: p.keluhan || '',
      tindakan: p.tindakan || '',
      kader_pencatat: p.kaderPencatat || '',
    };

    const res = await supabaseFetch('pemeriksaan_kehamilan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  // ================= 2. BALITA =================
  async getBalita(): Promise<Balita[] | null> {
    const rows = await supabaseFetch<any[]>('balita?select=*&order=created_at.desc');
    if (!rows) return null;

    return rows.map((b) => ({
      id: b.id,
      nik: b.nik || '',
      nama: b.nama,
      tanggalLahir: b.tanggal_lahir,
      jenisKelamin: b.jenis_kelamin,
      namaIbu: b.nama_ibu || '',
      nikIbu: b.nik_ibu || '',
      namaAyah: b.nama_ayah || '',
      beratLahirKg: Number(b.berat_lahir_kg || 0),
      panjangLahirCm: Number(b.panjang_lahir_cm || 0),
      alamat: b.alamat || '',
      noHp: b.no_hp || '',
      createdAt: b.created_at || new Date().toISOString(),
    }));
  },

  async saveBalita(data: Balita): Promise<boolean> {
    const payload = {
      id: data.id,
      nik: data.nik || null,
      nama: data.nama,
      tanggal_lahir: data.tanggalLahir,
      jenis_kelamin: data.jenisKelamin,
      nama_ibu: data.namaIbu || '',
      nik_ibu: data.nikIbu || null,
      nama_ayah: data.namaAyah || '',
      berat_lahir_kg: data.beratLahirKg || 0,
      panjang_lahir_cm: data.panjangLahirCm || 0,
      alamat: data.alamat || '',
      no_hp: data.noHp || '',
      created_at: data.createdAt || new Date().toISOString(),
    };

    const res = await supabaseFetch('balita', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deleteBalita(id: string): Promise<boolean> {
    const res = await supabaseFetch(`balita?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  // ================= 3. IMUNISASI =================
  async getImunisasi(): Promise<ImunisasiRecord[] | null> {
    const rows = await supabaseFetch<any[]>('imunisasi?select=*&order=created_at.desc');
    if (!rows) return null;

    return rows.map((i) => ({
      id: i.id,
      balitaId: i.balita_id,
      nikBalita: i.nik_balita || '',
      namaBalita: i.nama_balita,
      jenisVaksin: i.jenis_vaksin,
      tanggalDiberikan: i.tanggal_diberikan,
      usiaBulanSaatDiberikan: Number(i.usia_bulan_saat_diberikan || 0),
      kaderPemberi: i.kader_pemberi || '',
      catatan: i.catatan || '',
      createdAt: i.created_at || new Date().toISOString(),
    }));
  },

  async saveImunisasi(data: ImunisasiRecord): Promise<boolean> {
    const payload = {
      id: data.id,
      balita_id: data.balitaId,
      nik_balita: data.nikBalita || '',
      nama_balita: data.namaBalita,
      jenis_vaksin: data.jenisVaksin,
      tanggal_diberikan: data.tanggalDiberikan,
      usia_bulan_saat_diberikan: data.usiaBulanSaatDiberikan || 0,
      kader_pemberi: data.kaderPemberi || '',
      catatan: data.catatan || '',
      created_at: new Date().toISOString(),
    };

    const res = await supabaseFetch('imunisasi', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deleteImunisasi(id: string): Promise<boolean> {
    const res = await supabaseFetch(`imunisasi?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  // ================= 4. PERTUMBUHAN =================
  async getPertumbuhan(): Promise<PertumbuhanRecord[] | null> {
    const rows = await supabaseFetch<any[]>('pertumbuhan?select=*&order=created_at.desc');
    if (!rows) return null;

    return rows.map((p) => ({
      id: p.id,
      balitaId: p.balita_id,
      tanggal: p.tanggal,
      usiaBulan: Number(p.usia_bulan || 0),
      beratBadanKg: Number(p.berat_badan_kg || 0),
      tinggiBadanCm: Number(p.tinggi_badan_cm || 0),
      lingkarKepalaCm: Number(p.lingkar_kepala_cm || 0),
      lingkarDadaCm: p.lingkar_dada_cm ? Number(p.lingkar_dada_cm) : undefined,
      statusGizi: p.status_gizi || 'Gizi Baik',
      vitaminA: Boolean(p.vitamin_a),
      obatCacing: Boolean(p.obat_cacing),
      kaderPencatat: p.kader_pencatat || '',
      createdAt: p.created_at || new Date().toISOString(),
    }));
  },

  async savePertumbuhan(data: PertumbuhanRecord): Promise<boolean> {
    const payload = {
      id: data.id,
      balita_id: data.balitaId,
      tanggal: data.tanggal,
      usia_bulan: data.usiaBulan || 0,
      berat_badan_kg: data.beratBadanKg || 0,
      tinggi_badan_cm: data.tinggiBadanCm || 0,
      lingkar_kepala_cm: data.lingkarKepalaCm || 0,
      lingkar_dada_cm: data.lingkarDadaCm || null,
      status_gizi: data.statusGizi || 'Gizi Baik',
      vitamin_a: Boolean(data.vitaminA),
      obat_cacing: Boolean(data.obatCacing),
      kader_pencatat: data.kaderPencatat || '',
      created_at: new Date().toISOString(),
    };

    const res = await supabaseFetch('pertumbuhan', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deletePertumbuhan(id: string): Promise<boolean> {
    const res = await supabaseFetch(`pertumbuhan?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  // ================= 5. JADWAL POSYANDU =================
  async getJadwal(): Promise<JadwalPosyandu[] | null> {
    const rows = await supabaseFetch<any[]>('jadwal_posyandu?select=*&order=tanggal.asc');
    if (!rows) return null;

    return rows.map((j) => ({
      id: j.id,
      judul: j.judul,
      tanggal: j.tanggal,
      waktu: j.waktu,
      lokasi: j.lokasi,
      kategori: j.kategori,
      keterangan: j.keterangan || '',
      petugas: j.petugas || '',
      createdAt: j.created_at || new Date().toISOString(),
    }));
  },

  async saveJadwal(data: JadwalPosyandu): Promise<boolean> {
    const payload = {
      id: data.id,
      judul: data.judul,
      tanggal: data.tanggal,
      waktu: data.waktu,
      lokasi: data.lokasi,
      kategori: data.kategori,
      keterangan: data.keterangan || '',
      petugas: data.petugas || '',
      created_at: data.createdAt || new Date().toISOString(),
    };

    const res = await supabaseFetch('jadwal_posyandu', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload),
    });
    return res !== null;
  },

  async deleteJadwal(id: string): Promise<boolean> {
    const res = await supabaseFetch(`jadwal_posyandu?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res !== null;
  },

  // ================= 6. VERIFIKASI NIK WARGA LIVE CLOUD =================
  async verifyNik(cleanNik: string): Promise<{ registered: boolean; name: string }> {
    try {
      // Cek Ibu Hamil
      const ibuRes = await supabaseFetch<any[]>(`ibu_hamil?nik=eq.${encodeURIComponent(cleanNik)}&select=nama&limit=1`);
      if (ibuRes && ibuRes.length > 0) {
        return { registered: true, name: ibuRes[0].nama };
      }

      // Cek Balita (NIK Ibu)
      const balitaIbuRes = await supabaseFetch<any[]>(`balita?nik_ibu=eq.${encodeURIComponent(cleanNik)}&select=nama,nama_ibu&limit=1`);
      if (balitaIbuRes && balitaIbuRes.length > 0) {
        return {
          registered: true,
          name: balitaIbuRes[0].nama_ibu || `Orang Tua (${balitaIbuRes[0].nama})`,
        };
      }

      // Cek Balita (NIK Balita)
      const balitaSelfRes = await supabaseFetch<any[]>(`balita?nik=eq.${encodeURIComponent(cleanNik)}&select=nama&limit=1`);
      if (balitaSelfRes && balitaSelfRes.length > 0) {
        return { registered: true, name: balitaSelfRes[0].nama };
      }

      return { registered: false, name: '' };
    } catch {
      return { registered: false, name: '' };
    }
  },

  // ================= 7. LOGIN PETUGAS LIVE CLOUD =================
  async loginPetugas(username: string, pass: string, role: string): Promise<UserSession | null> {
    try {
      const rows = await supabaseFetch<any[]>(
        `users?username=eq.${encodeURIComponent(username.toLowerCase().trim())}&password=eq.${encodeURIComponent(pass)}&role=eq.${encodeURIComponent(role)}&limit=1`
      );
      if (rows && rows.length > 0) {
        const u = rows[0];
        return {
          role: u.role,
          name: u.name,
          username: u.username,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};
