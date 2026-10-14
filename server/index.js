import express from 'express';
import cors from 'cors';
import db, { initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Inisialisasi Database SQLite
initDatabase();

// ================= 1. HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected', engine: 'SQLite (node:sqlite)' });
});

// ================= 2. AUTENTIKASI & VERIFIKASI =================
app.post('/api/auth/login-petugas', (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  const query = 'SELECT id, username, name, role FROM users WHERE LOWER(username) = LOWER(?) AND password = ? AND role = ?';
  const user = db.prepare(query).get(username.trim(), password, role);

  if (user) {
    return res.json({
      success: true,
      user: {
        role: user.role,
        name: user.name,
        username: user.username,
      },
    });
  }

  return res.status(401).json({ error: `Username atau password ${role} salah!` });
});

app.get('/api/auth/verify-nik/:nik', (req, res) => {
  const rawNik = (req.params.nik || '').trim();
  if (!rawNik) {
    return res.json({ registered: false, name: '' });
  }

  // 1. Cek di daftar Ibu Hamil
  const ibu = db.prepare('SELECT nama FROM ibu_hamil WHERE TRIM(nik) = ?').get(rawNik);
  if (ibu) {
    return res.json({ registered: true, name: ibu.nama });
  }

  // 2. Cek di daftar Balita (apakah NIK orang tua/ibu balita)
  const balitaByIbu = db.prepare('SELECT nama, nama_ibu FROM balita WHERE TRIM(nik_ibu) = ?').get(rawNik);
  if (balitaByIbu) {
    return res.json({
      registered: true,
      name: balitaByIbu.nama_ibu || `Orang Tua (${balitaByIbu.nama})`,
    });
  }

  // 3. Cek di daftar Balita (NIK balita itu sendiri)
  const balitaSelf = db.prepare('SELECT nama FROM balita WHERE TRIM(nik) = ?').get(rawNik);
  if (balitaSelf) {
    return res.json({ registered: true, name: balitaSelf.nama });
  }

  return res.json({ registered: false, name: '' });
});

// ================= 3. IBU HAMIL =================
app.get('/api/ibu-hamil', (req, res) => {
  try {
    const ibuRows = db.prepare('SELECT * FROM ibu_hamil ORDER BY created_at DESC').all();
    const pemeriksaanRows = db.prepare('SELECT * FROM pemeriksaan_kehamilan ORDER BY tanggal DESC').all();

    // Group pemeriksaan by ibu_hamil_id
    const pemMap = {};
    for (const p of pemeriksaanRows) {
      if (!pemMap[p.ibu_hamil_id]) pemMap[p.ibu_hamil_id] = [];
      pemMap[p.ibu_hamil_id].push({
        id: p.id,
        tanggal: p.tanggal,
        usiaKehamilanMinggu: p.usia_kehamilan_minggu,
        beratBadanKg: p.berat_badan_kg,
        tekananDarah: p.tekanan_darah,
        tinggiFundusCm: p.tinggi_fundus_cm,
        djj: p.djj,
        keluhan: p.keluhan,
        tindakan: p.tindakan,
        kaderPencatat: p.kader_pencatat,
      });
    }

    const result = ibuRows.map((i) => ({
      id: i.id,
      nik: i.nik,
      nama: i.nama,
      tanggalLahir: i.tanggal_lahir,
      usia: i.usia,
      namaSuami: i.nama_suami,
      noHp: i.no_hp,
      alamat: i.alamat,
      hpht: i.hpht,
      hpl: i.hpl,
      gravida: i.gravida,
      paritas: i.paritas,
      abortus: i.abortus,
      lila: i.lila,
      statusResiko: i.status_resiko,
      catatanResiko: i.catatan_resiko,
      riwayatPemeriksaan: pemMap[i.id] || [],
      createdAt: i.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching ibu hamil:', err);
    res.status(500).json({ error: 'Gagal mengambil data ibu hamil.' });
  }
});

app.post('/api/ibu-hamil', (req, res) => {
  try {
    const data = req.body;
    const cleanNik = (data.nik || '').trim();
    if (!cleanNik) {
      return res.status(400).json({ error: 'NIK wajib diisi.' });
    }

    // Cek duplikasi NIK selain id yang sedang diedit
    const existing = db.prepare('SELECT id, nama FROM ibu_hamil WHERE TRIM(nik) = ?').get(cleanNik);
    if (existing && existing.id !== data.id) {
      return res.status(400).json({
        error: `NIK ${cleanNik} sudah terdaftar atas nama Ibu "${existing.nama}"! Gunakan NIK yang berbeda.`,
      });
    }

    if (data.id) {
      // Update
      const stmt = db.prepare(`
        UPDATE ibu_hamil SET
          nik = ?, nama = ?, tanggal_lahir = ?, usia = ?, nama_suami = ?,
          no_hp = ?, alamat = ?, hpht = ?, hpl = ?, gravida = ?, paritas = ?,
          abortus = ?, lila = ?, status_resiko = ?, catatan_resiko = ?
        WHERE id = ?
      `);
      stmt.run(
        cleanNik,
        data.nama,
        data.tanggalLahir || null,
        data.usia || 0,
        data.namaSuami || '',
        data.noHp || '',
        data.alamat || '',
        data.hpht || null,
        data.hpl || null,
        data.gravida || 1,
        data.paritas || 0,
        data.abortus || 0,
        data.lila || 0,
        data.statusResiko || 'Rendah',
        data.catatanResiko || '',
        data.id
      );

      const updated = db.prepare('SELECT * FROM ibu_hamil WHERE id = ?').get(data.id);
      return res.json({ ...data, ...updated });
    } else {
      // Insert baru
      const newId = 'IBU-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO ibu_hamil (
          id, nik, nama, tanggal_lahir, usia, nama_suami, no_hp, alamat,
          hpht, hpl, gravida, paritas, abortus, lila, status_resiko, catatan_resiko, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        newId,
        cleanNik,
        data.nama,
        data.tanggalLahir || null,
        data.usia || 0,
        data.namaSuami || '',
        data.noHp || '',
        data.alamat || '',
        data.hpht || null,
        data.hpl || null,
        data.gravida || 1,
        data.paritas || 0,
        data.abortus || 0,
        data.lila || 0,
        data.statusResiko || 'Rendah',
        data.catatanResiko || '',
        createdAt
      );

      const savedItem = {
        ...data,
        id: newId,
        nik: cleanNik,
        riwayatPemeriksaan: [],
        createdAt,
      };
      return res.status(201).json(savedItem);
    }
  } catch (err) {
    console.error('Error saving ibu hamil:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan data ibu hamil.' });
  }
});

app.delete('/api/ibu-hamil/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM ibu_hamil WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data ibu hamil berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting ibu hamil:', err);
    res.status(500).json({ error: 'Gagal menghapus data ibu hamil.' });
  }
});

app.post('/api/ibu-hamil/:id/pemeriksaan', (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const newPemId = 'PEM-' + Date.now();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO pemeriksaan_kehamilan (
        id, ibu_hamil_id, tanggal, usia_kehamilan_minggu, berat_badan_kg,
        tekanan_darah, tinggi_fundus_cm, djj, keluhan, tindakan, kader_pencatat, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newPemId,
      id,
      p.tanggal,
      p.usiaKehamilanMinggu || 0,
      p.beratBadanKg || 0,
      p.tekananDarah || '',
      p.tinggiFundusCm || null,
      p.djj || null,
      p.keluhan || '',
      p.tindakan || '',
      p.kaderPencatat || '',
      createdAt
    );

    res.status(201).json({
      ...p,
      id: newPemId,
      ibuHamilId: id,
      createdAt,
    });
  } catch (err) {
    console.error('Error adding pemeriksaan:', err);
    res.status(500).json({ error: 'Gagal mencatat pemeriksaan kehamilan.' });
  }
});

// ================= 4. BALITA =================
app.get('/api/balita', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM balita ORDER BY created_at DESC').all();
    const result = rows.map((b) => ({
      id: b.id,
      nik: b.nik,
      nama: b.nama,
      tanggalLahir: b.tanggal_lahir,
      jenisKelamin: b.jenis_kelamin,
      namaIbu: b.nama_ibu,
      nikIbu: b.nik_ibu,
      namaAyah: b.nama_ayah,
      beratLahirKg: b.berat_lahir_kg,
      panjangLahirCm: b.panjang_lahir_cm,
      alamat: b.alamat,
      noHp: b.no_hp,
      createdAt: b.created_at,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching balita:', err);
    res.status(500).json({ error: 'Gagal mengambil data balita.' });
  }
});

app.post('/api/balita', (req, res) => {
  try {
    const data = req.body;
    const cleanNik = data.nik ? data.nik.trim() : '';
    const cleanNikIbu = data.nikIbu ? data.nikIbu.trim() : '';

    if (cleanNik && cleanNik !== '-' && !cleanNik.startsWith('BAYI-')) {
      const existing = db.prepare('SELECT id, nama, nik_ibu FROM balita WHERE TRIM(nik) = ?').get(cleanNik);
      if (existing && existing.id !== data.id) {
        const sameFamily =
          (cleanNikIbu && existing.nik_ibu && existing.nik_ibu.trim() === cleanNikIbu) ||
          (cleanNikIbu && cleanNik === cleanNikIbu);

        if (!sameFamily) {
          return res.status(400).json({
            error: `NIK ${cleanNik} sudah terdaftar atas nama balita "${existing.nama}". Jika dalam 1 keluarga, pastikan NIK Ibu diisi sama.`,
          });
        }
      }
    }

    const finalNik = cleanNik || `BAYI-${Date.now().toString().slice(-6)}`;

    if (data.id) {
      // Update
      const stmt = db.prepare(`
        UPDATE balita SET
          nik = ?, nama = ?, tanggal_lahir = ?, jenis_kelamin = ?, nama_ibu = ?,
          nik_ibu = ?, nama_ayah = ?, berat_lahir_kg = ?, panjang_lahir_cm = ?,
          alamat = ?, no_hp = ?
        WHERE id = ?
      `);
      stmt.run(
        finalNik,
        data.nama,
        data.tanggalLahir,
        data.jenisKelamin,
        data.namaIbu || '',
        cleanNikIbu,
        data.namaAyah || '',
        data.beratLahirKg || 0,
        data.panjangLahirCm || 0,
        data.alamat || '',
        data.noHp || '',
        data.id
      );

      return res.json({ ...data, nik: finalNik });
    } else {
      // Insert baru
      const newId = 'BALITA-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const createdAt = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO balita (
          id, nik, nama, tanggal_lahir, jenis_kelamin, nama_ibu, nik_ibu,
          nama_ayah, berat_lahir_kg, panjang_lahir_cm, alamat, no_hp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        newId,
        finalNik,
        data.nama,
        data.tanggalLahir,
        data.jenisKelamin,
        data.namaIbu || '',
        cleanNikIbu,
        data.namaAyah || '',
        data.beratLahirKg || 0,
        data.panjangLahirCm || 0,
        data.alamat || '',
        data.noHp || '',
        createdAt
      );

      return res.status(201).json({
        ...data,
        id: newId,
        nik: finalNik,
        createdAt,
      });
    }
  } catch (err) {
    console.error('Error saving balita:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan data balita.' });
  }
});

app.delete('/api/balita/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM balita WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data balita dan riwayatnya berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting balita:', err);
    res.status(500).json({ error: 'Gagal menghapus data balita.' });
  }
});

// ================= 5. IMUNISASI =================
app.get('/api/imunisasi', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM imunisasi ORDER BY created_at DESC').all();
    const result = rows.map((i) => ({
      id: i.id,
      balitaId: i.balita_id,
      nikBalita: i.nik_balita,
      namaBalita: i.nama_balita,
      jenisVaksin: i.jenis_vaksin,
      tanggalDiberikan: i.tanggal_diberikan,
      usiaBulanSaatDiberikan: i.usia_bulan_saat_diberikan,
      kaderPemberi: i.kader_pemberi,
      catatan: i.catatan,
      createdAt: i.created_at,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching imunisasi:', err);
    res.status(500).json({ error: 'Gagal mengambil data imunisasi.' });
  }
});

app.post('/api/imunisasi', (req, res) => {
  try {
    const data = req.body;
    const newId = 'IMU-' + Date.now();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO imunisasi (
        id, balita_id, nik_balita, nama_balita, jenis_vaksin,
        tanggal_diberikan, usia_bulan_saat_diberikan, kader_pemberi, catatan, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      data.balitaId,
      data.nikBalita || '',
      data.namaBalita,
      data.jenisVaksin,
      data.tanggalDiberikan,
      data.usiaBulanSaatDiberikan || 0,
      data.kaderPemberi || '',
      data.catatan || '',
      createdAt
    );

    res.status(201).json({
      ...data,
      id: newId,
      createdAt,
    });
  } catch (err) {
    console.error('Error saving imunisasi:', err);
    res.status(500).json({ error: 'Gagal menyimpan catatan imunisasi.' });
  }
});

app.delete('/api/imunisasi/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM imunisasi WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data imunisasi berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting imunisasi:', err);
    res.status(500).json({ error: 'Gagal menghapus data imunisasi.' });
  }
});

// ================= 6. PERTUMBUHAN =================
app.get('/api/pertumbuhan', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pertumbuhan ORDER BY created_at DESC').all();
    const result = rows.map((p) => ({
      id: p.id,
      balitaId: p.balita_id,
      tanggal: p.tanggal,
      usiaBulan: p.usia_bulan,
      beratBadanKg: p.berat_badan_kg,
      tinggiBadanCm: p.tinggi_badan_cm,
      lingkarKepalaCm: p.lingkar_kepala_cm,
      lingkarDadaCm: p.lingkar_dada_cm,
      statusGizi: p.status_gizi,
      vitaminA: Boolean(p.vitamin_a),
      obatCacing: Boolean(p.obat_cacing),
      kaderPencatat: p.kader_pencatat,
      createdAt: p.created_at,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching pertumbuhan:', err);
    res.status(500).json({ error: 'Gagal mengambil data pertumbuhan.' });
  }
});

app.post('/api/pertumbuhan', (req, res) => {
  try {
    const data = req.body;
    const newId = 'TUMB-' + Date.now();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO pertumbuhan (
        id, balita_id, tanggal, usia_bulan, berat_badan_kg, tinggi_badan_cm,
        lingkar_kepala_cm, lingkar_dada_cm, status_gizi, vitamin_a, obat_cacing,
        kader_pencatat, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newId,
      data.balitaId,
      data.tanggal,
      data.usiaBulan || 0,
      data.beratBadanKg || 0,
      data.tinggiBadanCm || 0,
      data.lingkarKepalaCm || 0,
      data.lingkarDadaCm || null,
      data.statusGizi || 'Gizi Baik',
      data.vitaminA ? 1 : 0,
      data.obatCacing ? 1 : 0,
      data.kaderPencatat || '',
      createdAt
    );

    res.status(201).json({
      ...data,
      id: newId,
      createdAt,
    });
  } catch (err) {
    console.error('Error saving pertumbuhan:', err);
    res.status(500).json({ error: 'Gagal menyimpan catatan pertumbuhan.' });
  }
});

app.delete('/api/pertumbuhan/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM pertumbuhan WHERE id = ?').run(id);
    res.json({ success: true, message: 'Data pertumbuhan berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting pertumbuhan:', err);
    res.status(500).json({ error: 'Gagal menghapus data pertumbuhan.' });
  }
});

// ================= 7. JADWAL POSYANDU =================
app.get('/api/jadwal', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM jadwal_posyandu ORDER BY tanggal ASC').all();
    const result = rows.map((j) => ({
      id: j.id,
      judul: j.judul,
      tanggal: j.tanggal,
      waktu: j.waktu,
      lokasi: j.lokasi,
      kategori: j.kategori,
      keterangan: j.keterangan,
      petugas: j.petugas,
      createdAt: j.created_at,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching jadwal:', err);
    res.status(500).json({ error: 'Gagal mengambil jadwal posyandu.' });
  }
});

app.post('/api/jadwal', (req, res) => {
  try {
    const data = req.body;
    if (data.id) {
      const stmt = db.prepare(`
        UPDATE jadwal_posyandu SET
          judul = ?, tanggal = ?, waktu = ?, lokasi = ?,
          kategori = ?, keterangan = ?, petugas = ?
        WHERE id = ?
      `);
      stmt.run(
        data.judul,
        data.tanggal,
        data.waktu,
        data.lokasi,
        data.kategori,
        data.keterangan || '',
        data.petugas || '',
        data.id
      );
      return res.json(data);
    } else {
      const newId = 'JDW-' + Date.now();
      const createdAt = new Date().toISOString();
      const stmt = db.prepare(`
        INSERT INTO jadwal_posyandu (
          id, judul, tanggal, waktu, lokasi, kategori, keterangan, petugas, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        newId,
        data.judul,
        data.tanggal,
        data.waktu,
        data.lokasi,
        data.kategori,
        data.keterangan || '',
        data.petugas || '',
        createdAt
      );
      return res.status(201).json({ ...data, id: newId, createdAt });
    }
  } catch (err) {
    console.error('Error saving jadwal:', err);
    res.status(500).json({ error: 'Gagal menyimpan jadwal posyandu.' });
  }
});

app.delete('/api/jadwal/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM jadwal_posyandu WHERE id = ?').run(id);
    res.json({ success: true, message: 'Jadwal posyandu berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting jadwal:', err);
    res.status(500).json({ error: 'Gagal menghapus jadwal.' });
  }
});

// ================= 8. MASTER VAKSIN =================
app.get('/api/master-vaksin', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM master_vaksin ORDER BY usia_bulan ASC').all();
    const result = rows.map((v) => ({
      kode: v.kode,
      nama: v.nama,
      usiaBulan: v.usia_bulan,
      deskripsi: v.deskripsi,
      wajib: Boolean(v.wajib),
    }));
    res.json(result);
  } catch (err) {
    console.error('Error fetching master vaksin:', err);
    res.status(500).json({ error: 'Gagal mengambil master vaksin.' });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [Backend API Posyandu] Berjalan di port ${PORT}`);
  console.log(`📁 Database: SQLite (server/data/posyandu.db)`);
  console.log(`🔗 Endpoint API: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});
