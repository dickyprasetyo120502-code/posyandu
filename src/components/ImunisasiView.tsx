import React, { useState } from 'react';
import type { Balita, ImunisasiRecord, PertumbuhanRecord, UserSession } from '../types';
import { JADWAL_VAKSIN_KEMENKES } from '../types';
import { 
  storageService, 
  formatTanggalIndo, 
  hitungUsiaBulan 
} from '../services/storage';
import { 
  Baby, 
  Plus, 
  Search, 
  Syringe, 
  Trash2, 
  TrendingUp, 
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ImunisasiViewProps {
  session: UserSession | null;
  onOpenLogin: () => void;
  balitaList: Balita[];
  imunisasiList: ImunisasiRecord[];
  pertumbuhanList: PertumbuhanRecord[];
  onRefresh: () => void;
}

export const ImunisasiView: React.FC<ImunisasiViewProps> = ({
  session,
  onOpenLogin,
  balitaList,
  imunisasiList,
  pertumbuhanList,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddBalitaModal, setShowAddBalitaModal] = useState(false);
  const [showVaksinModal, setShowVaksinModal] = useState<Balita | null>(null);
  const [showPertumbuhanModal, setShowPertumbuhanModal] = useState<Balita | null>(null);
  const [selectedBalitaDetail, setSelectedBalitaDetail] = useState<Balita | null>(null);

  // Form Balita Baru
  const [balitaForm, setBalitaForm] = useState({
    nik: '',
    nama: '',
    tanggalLahir: '',
    jenisKelamin: 'L' as 'L' | 'P',
    namaIbu: '',
    nikIbu: '',
    namaAyah: '',
    beratLahirKg: '' as unknown as number,
    panjangLahirCm: '' as unknown as number,
    alamat: '',
    noHp: '',
  });

  // Form Tambah Vaksin
  const [vaksinForm, setVaksinForm] = useState({
    jenisVaksin: 'HB-0',
    tanggalDiberikan: new Date().toISOString().split('T')[0],
    catatan: '',
  });

  // Form Catat Pertumbuhan
  const [tumbuhForm, setTumbuhForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    beratBadanKg: '' as unknown as number,
    tinggiBadanCm: '' as unknown as number,
    lingkarKepalaCm: '' as unknown as number,
    lingkarDadaCm: '' as string,
    statusGizi: 'Gizi Baik' as 'Gizi Baik' | 'Gizi Kurang' | 'Gizi Lebih' | 'Beresiko Stunting',
    vitaminA: false,
    obatCacing: false,
  });

  const filteredBalita = balitaList.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      b.nama.toLowerCase().includes(q) ||
      (b.nik ? b.nik.toLowerCase().includes(q) : false) ||
      b.namaIbu.toLowerCase().includes(q)
    );
  });

  const handleSaveBalita = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !balitaForm.nama.trim() ||
      !balitaForm.tanggalLahir ||
      !balitaForm.namaIbu.trim() ||
      !balitaForm.nikIbu.trim() ||
      !balitaForm.namaAyah.trim() ||
      !balitaForm.noHp.trim() ||
      !balitaForm.alamat.trim() ||
      !balitaForm.beratLahirKg ||
      !balitaForm.panjangLahirCm
    ) {
      alert('Semua kolom data Balita dan Orang Tua wajib diisi lengkap! Jangan ada yang kosong.');
      return;
    }

    try {
      storageService.saveBalita({
        ...balitaForm,
        beratLahirKg: Number(balitaForm.beratLahirKg),
        panjangLahirCm: Number(balitaForm.panjangLahirCm),
      });
      onRefresh();
      setShowAddBalitaModal(false);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      // Reset Form
      setBalitaForm({
        nik: '',
        nama: '',
        tanggalLahir: '',
        jenisKelamin: 'L',
        namaIbu: '',
        nikIbu: '',
        namaAyah: '',
        beratLahirKg: '' as unknown as number,
        panjangLahirCm: '' as unknown as number,
        alamat: '',
        noHp: '',
      });
      alert('Data Pasien Balita berhasil didaftarkan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data balita.');
    }
  };

  const handleDeleteBalita = (id: string, nama: string) => {
    if (confirm(`Hapus data balita "${nama}" beserta seluruh rekam imunisasinya?`)) {
      storageService.deleteBalita(id);
      onRefresh();
      if (selectedBalitaDetail?.id === id) setSelectedBalitaDetail(null);
    }
  };

  const handleDeleteImunisasiRecord = (id: string, namaVaksin: string) => {
    if (confirm(`Hapus riwayat vaksinasi "${namaVaksin}" ini?`)) {
      storageService.deleteImunisasi(id);
      onRefresh();
    }
  };

  const handleDeletePertumbuhanRecord = (id: string) => {
    if (confirm('Hapus catatan pengukuran fisik (KMS) ini?')) {
      storageService.deletePertumbuhan(id);
      onRefresh();
    }
  };

  const handleSaveVaksin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVaksinModal) return;

    if (!vaksinForm.jenisVaksin || !vaksinForm.tanggalDiberikan) {
      alert('Mohon lengkapi jenis vaksin dan tanggal vaksinasi!');
      return;
    }

    const usiaBln = hitungUsiaBulan(showVaksinModal.tanggalLahir);

    storageService.saveImunisasi({
      balitaId: showVaksinModal.id,
      nikBalita: showVaksinModal.nik || 'No. Reg Posyandu',
      namaBalita: showVaksinModal.nama,
      jenisVaksin: vaksinForm.jenisVaksin,
      tanggalDiberikan: vaksinForm.tanggalDiberikan,
      usiaBulanSaatDiberikan: usiaBln,
      kaderPemberi: session?.name || 'Kader Posyandu',
      catatan: vaksinForm.catatan,
    });

    onRefresh();
    setShowVaksinModal(null);
    alert('Rekam imunisasi berhasil disimpan!');
  };

  const handleSavePertumbuhan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPertumbuhanModal) return;

    if (
      !tumbuhForm.tanggal ||
      !tumbuhForm.beratBadanKg ||
      !tumbuhForm.tinggiBadanCm ||
      !tumbuhForm.lingkarKepalaCm
    ) {
      alert('Mohon isi semua data pengukuran fisik (Tanggal, Berat Badan, Tinggi Badan, dan Lingkar Kepala)!');
      return;
    }

    const usiaBln = hitungUsiaBulan(showPertumbuhanModal.tanggalLahir);

    storageService.savePertumbuhan({
      balitaId: showPertumbuhanModal.id,
      tanggal: tumbuhForm.tanggal,
      usiaBulan: usiaBln,
      beratBadanKg: Number(tumbuhForm.beratBadanKg),
      tinggiBadanCm: Number(tumbuhForm.tinggiBadanCm),
      lingkarKepalaCm: Number(tumbuhForm.lingkarKepalaCm),
      lingkarDadaCm: tumbuhForm.lingkarDadaCm ? Number(tumbuhForm.lingkarDadaCm) : undefined,
      statusGizi: tumbuhForm.statusGizi,
      vitaminA: tumbuhForm.vitaminA,
      obatCacing: tumbuhForm.obatCacing,
      kaderPencatat: session?.name || 'Kader Posyandu',
    });

    onRefresh();
    setShowPertumbuhanModal(null);
    setTumbuhForm({
      tanggal: new Date().toISOString().split('T')[0],
      beratBadanKg: '' as unknown as number,
      tinggiBadanCm: '' as unknown as number,
      lingkarKepalaCm: '' as unknown as number,
      lingkarDadaCm: '',
      statusGizi: 'Gizi Baik',
      vitaminA: false,
      obatCacing: false,
    });
    alert('Pengukuran tumbuh kembang berhasil dicatat!');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-600/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-md">
            <Baby className="w-3.5 h-3.5" />
            <span>KMS & Imunisasi Balita</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pencatatan Imunisasi & Tumbuh Kembang Balita
          </h1>
          <p className="text-sm sm:text-base text-teal-100 mt-2">
            Pantau jadwal vaksinasi lengkap standar Kementerian Kesehatan RI, catat berat/tinggi badan rutin, dan cegah risiko stunting sedini mungkin.
          </p>

        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari NIK, Nama Balita, atau Nama Ibu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={() => {
                if (!session) onOpenLogin();
                else setShowAddBalitaModal(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pasien Balita</span>
            </button>
          </div>

          {/* Cards or Empty State */}
          {filteredBalita.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center max-w-xl mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <Baby className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {searchQuery ? 'Data Tidak Ditemukan' : 'Belum Ada Pasien Balita'}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada pasien balita yang cocok dengan "${searchQuery}".`
                  : 'Sistem dimulai dari 0 tanpa data dummy. Klik tombol di bawah untuk mendaftarkan balita pertama.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    if (!session) onOpenLogin();
                    else setShowAddBalitaModal(true);
                  }}
                  className="mt-5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Balita Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBalita.map((balita) => {
                const usiaBulan = hitungUsiaBulan(balita.tanggalLahir);
                const vaksinListBalita = imunisasiList.filter((i) => i.balitaId === balita.id);
                const tumbuhListBalita = pertumbuhanList.filter((p) => p.balitaId === balita.id);
                const latestTumbuh = tumbuhListBalita[0];

                return (
                  <div
                    key={balita.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                            balita.jenisKelamin === 'L'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {balita.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {balita.nik ? `NIK: ${balita.nik}` : 'No. Reg Posyandu'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 leading-snug">
                        {balita.nama}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Lahir: {formatTanggalIndo(balita.tanggalLahir)} • <strong>{usiaBulan} Bulan</strong>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Ibu: <strong>{balita.namaIbu || '-'}</strong> • Ayah: {balita.namaAyah || '-'}
                      </p>

                      {/* Status Vaksinasi & Pertumbuhan */}
                      <div className="mt-4 p-3 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-800 flex items-center gap-1.5">
                            <Syringe className="w-3.5 h-3.5 text-teal-600" />
                            <span>Vaksinasi Terdaftar:</span>
                          </span>
                          <span className="font-extrabold text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200 text-xs">
                            {vaksinListBalita.length} Vaksin
                          </span>
                        </div>

                        {latestTumbuh && (
                          <div className="pt-2 border-t border-teal-100/80 text-[11px] text-slate-600 flex items-center justify-between">
                            <span>BB: <strong>{latestTumbuh.beratBadanKg} kg</strong></span>
                            <span>TB: <strong>{latestTumbuh.tinggiBadanCm} cm</strong></span>
                            <span className="text-teal-700 font-bold">{latestTumbuh.statusGizi}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setShowVaksinModal(balita)}
                          className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Syringe className="w-3.5 h-3.5" />
                          <span>+ Vaksin</span>
                        </button>
                        <button
                          onClick={() => setShowPertumbuhanModal(balita)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+ Tumbuh</span>
                        </button>
                        <button
                          onClick={() => setSelectedBalitaDetail(balita)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Buku KMS
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteBalita(balita.id, balita.nama)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* MODAL 1: Tambah Balita Baru */}
      {showAddBalitaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl my-8 overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Baby className="w-5 h-5 text-white" />
                <h3 className="font-bold text-lg">Pendaftaran Balita Baru</h3>
              </div>
              <button
                onClick={() => setShowAddBalitaModal(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBalita} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK Balita (Opsional - Jika belum punya, kosongkan saja)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="Kosongkan jika belum ada NIK..."
                    value={balitaForm.nik}
                    onChange={(e) => setBalitaForm({ ...balitaForm, nik: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bayi baru lahir otomatis diberikan No. Registrasi Posyandu jika belum memiliki NIK.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Balita *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Balita"
                    value={balitaForm.nama}
                    onChange={(e) => setBalitaForm({ ...balitaForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    required
                    value={balitaForm.tanggalLahir}
                    onChange={(e) => setBalitaForm({ ...balitaForm, tanggalLahir: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={balitaForm.jenisKelamin}
                    onChange={(e) => setBalitaForm({ ...balitaForm, jenisKelamin: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white"
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Ibu Kandung
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ibu"
                    value={balitaForm.namaIbu}
                    onChange={(e) => setBalitaForm({ ...balitaForm, namaIbu: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK Ibu (Untuk Hubungkan Akun)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="NIK Ibu KTP"
                    value={balitaForm.nikIbu}
                    onChange={(e) => setBalitaForm({ ...balitaForm, nikIbu: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Ayah
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Ayah"
                    value={balitaForm.namaAyah}
                    onChange={(e) => setBalitaForm({ ...balitaForm, namaAyah: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="08..."
                    value={balitaForm.noHp}
                    onChange={(e) => setBalitaForm({ ...balitaForm, noHp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Berat Lahir (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Contoh: 3.2"
                    value={balitaForm.beratLahirKg || ''}
                    onChange={(e) => setBalitaForm({ ...balitaForm, beratLahirKg: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Panjang Lahir (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Contoh: 49"
                    value={balitaForm.panjangLahirCm || ''}
                    onChange={(e) => setBalitaForm({ ...balitaForm, panjangLahirCm: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Rumah
                </label>
                <textarea
                  rows={2}
                  placeholder="Dusun, RT/RW, Desa"
                  value={balitaForm.alamat}
                  onChange={(e) => setBalitaForm({ ...balitaForm, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBalitaModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  Simpan Pasien Balita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tambah Vaksin */}
      {showVaksinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Catat Pemberian Vaksin</h3>
                <p className="text-xs text-teal-100">
                  Pasien: {showVaksinModal.nama} ({showVaksinModal.nik ? `NIK: ${showVaksinModal.nik}` : 'No. Reg Posyandu'})
                </p>
              </div>
              <button
                onClick={() => setShowVaksinModal(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVaksin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Jenis Vaksin *
                </label>
                <select
                  value={vaksinForm.jenisVaksin}
                  onChange={(e) => setVaksinForm({ ...vaksinForm, jenisVaksin: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white"
                >
                  {JADWAL_VAKSIN_KEMENKES.map((vax) => (
                    <option key={vax.kode} value={vax.nama}>
                      {vax.nama} (Rekomendasi: {vax.usiaBulan} Bulan)
                    </option>
                  ))}
                  <option value="Vitamin A Biru (100.000 IU)">Vitamin A Biru (6-11 Bulan)</option>
                  <option value="Vitamin A Merah (200.000 IU)">Vitamin A Merah (1-5 Tahun)</option>
                  <option value="Vaksin Tambahan Lainnya">Vaksin Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Vaksinasi Diberikan
                </label>
                <input
                  type="date"
                  required
                  value={vaksinForm.tanggalDiberikan}
                  onChange={(e) => setVaksinForm({ ...vaksinForm, tanggalDiberikan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / No. Batch Vaksin (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Batch A2401, tidak ada demam"
                  value={vaksinForm.catatan}
                  onChange={(e) => setVaksinForm({ ...vaksinForm, catatan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowVaksinModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  Simpan Vaksin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Catat Pertumbuhan (BB, TB, Lingkar Kepala) */}
      {showPertumbuhanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Catat Pengukuran Fisik (KMS)</h3>
                <p className="text-xs text-emerald-100">
                  Pasien: {showPertumbuhanModal.nama} ({showPertumbuhanModal.nik ? `NIK: ${showPertumbuhanModal.nik}` : 'No. Reg Posyandu'})
                </p>
              </div>
              <button
                onClick={() => setShowPertumbuhanModal(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePertumbuhan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pengukuran
                </label>
                <input
                  type="date"
                  required
                  value={tumbuhForm.tanggal}
                  onChange={(e) => setTumbuhForm({ ...tumbuhForm, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Berat Badan (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="Contoh: 7.2"
                    value={tumbuhForm.beratBadanKg || ''}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, beratBadanKg: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tinggi Badan (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Contoh: 68"
                    value={tumbuhForm.tinggiBadanCm || ''}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, tinggiBadanCm: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lingkar Kepala (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Contoh: 43"
                    value={tumbuhForm.lingkarKepalaCm || ''}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, lingkarKepalaCm: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lingkar Dada (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Contoh: 44"
                    value={tumbuhForm.lingkarDadaCm}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, lingkarDadaCm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Status Gizi
                </label>
                <select
                  value={tumbuhForm.statusGizi}
                  onChange={(e) => setTumbuhForm({ ...tumbuhForm, statusGizi: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                >
                  <option value="Gizi Baik">Gizi Baik (Normal)</option>
                  <option value="Gizi Kurang">Gizi Kurang (Perlu PMT)</option>
                  <option value="Beresiko Stunting">Beresiko Stunting (Pendek/Sangat Pendek)</option>
                  <option value="Gizi Lebih">Gizi Lebih</option>
                </select>
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tumbuhForm.vitaminA}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, vitaminA: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Diberi Vitamin A</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tumbuhForm.obatCacing}
                    onChange={(e) => setTumbuhForm({ ...tumbuhForm, obatCacing: e.target.checked })}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Diberi Obat Cacing</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPertumbuhanModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20"
                >
                  Simpan Pengukuran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Buku KMS Digital Balita */}
      {selectedBalitaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Kartu Menuju Sehat (KMS) - {selectedBalitaDetail.nama}</h3>
                <p className="text-xs text-teal-100">
                  {selectedBalitaDetail.nik ? `NIK: ${selectedBalitaDetail.nik}` : 'No. Reg Posyandu'} • Usia: {hitungUsiaBulan(selectedBalitaDetail.tanggalLahir)} Bulan
                </p>
              </div>
              <button
                onClick={() => setSelectedBalitaDetail(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Balita Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Jenis Kelamin</span>
                  <span className="font-bold text-slate-800">
                    {selectedBalitaDetail.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Tgl Lahir</span>
                  <span className="font-bold text-slate-800">{formatTanggalIndo(selectedBalitaDetail.tanggalLahir)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">BB/TB Lahir</span>
                  <span className="font-bold text-slate-800">
                    {selectedBalitaDetail.beratLahirKg} kg / {selectedBalitaDetail.panjangLahirCm} cm
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Orang Tua</span>
                  <span className="font-bold text-slate-800">{selectedBalitaDetail.namaIbu || '-'}</span>
                </div>
              </div>

              {/* Riwayat Vaksinasi */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Vaksinasi Diberikan</span>
                </h4>
                {(() => {
                  const vaxList = imunisasiList.filter((i) => i.balitaId === selectedBalitaDetail.id);
                  if (vaxList.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                        Belum ada data vaksin yang dicatat.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {vaxList.map((vx) => (
                        <div
                          key={vx.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-teal-900 block">{vx.jenisVaksin}</span>
                            <span className="text-slate-500">
                              Diberikan pada usia {vx.usiaBulanSaatDiberikan} bulan • Petugas: {vx.kaderPemberi}
                            </span>
                            {vx.catatan && <p className="text-slate-600 mt-0.5">Catatan: {vx.catatan}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                              {formatTanggalIndo(vx.tanggalDiberikan)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteImunisasiRecord(vx.id, vx.jenisVaksin)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Hapus Rekam Vaksin Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Riwayat Pertumbuhan */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Riwayat Pengukuran Pertumbuhan (BB/TB/Lingkar)</span>
                </h4>
                {(() => {
                  const tmbList = pertumbuhanList.filter((p) => p.balitaId === selectedBalitaDetail.id);
                  if (tmbList.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 text-center">
                        Belum ada catatan pengukuran fisik.
                      </p>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold">
                            <th className="p-2.5 rounded-l-xl">Tanggal</th>
                            <th className="p-2.5">Usia</th>
                            <th className="p-2.5">BB (kg)</th>
                            <th className="p-2.5">TB (cm)</th>
                            <th className="p-2.5">LK / LD</th>
                            <th className="p-2.5">Status Gizi</th>
                            <th className="p-2.5">Suplementasi</th>
                            <th className="p-2.5 rounded-r-xl text-center">Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tmbList.map((tm) => (
                            <tr key={tm.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-medium">{formatTanggalIndo(tm.tanggal)}</td>
                              <td className="p-2.5">{tm.usiaBulan} bln</td>
                              <td className="p-2.5 font-bold text-teal-700">{tm.beratBadanKg} kg</td>
                              <td className="p-2.5">{tm.tinggiBadanCm} cm</td>
                              <td className="p-2.5 text-slate-600">
                                {tm.lingkarKepalaCm} cm {tm.lingkarDadaCm ? `/ LD ${tm.lingkarDadaCm} cm` : ''}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded font-semibold ${
                                  tm.statusGizi === 'Gizi Baik'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {tm.statusGizi}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600">
                                {tm.vitaminA && 'Vit A '}
                                {tm.obatCacing && 'Obat Cacing'}
                                {!tm.vitaminA && !tm.obatCacing && '-'}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePertumbuhanRecord(tm.id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Hapus Data Pengukuran Ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedBalitaDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
