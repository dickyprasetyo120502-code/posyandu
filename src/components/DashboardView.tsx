import React, { useState } from 'react';
import type { UserSession, IbuHamil, Balita, ImunisasiRecord, JadwalPosyandu } from '../types';
import { storageService, hitungHPLdanUsiaKehamilan, formatTanggalIndo } from '../services/storage';
import { 
  Heart, 
  Baby, 
  Syringe, 
  Clock, 
  ShieldCheck, 
  Calendar,
  Plus,
  Trash2,
  MapPin,
  X
} from 'lucide-react';

interface DashboardViewProps {
  session: UserSession | null;
  onOpenLogin: () => void;
  onNavigateTab: (tab: 'dashboard' | 'ibuHamil' | 'imunisasi' | 'warga') => void;
  ibuHamilList: IbuHamil[];
  balitaList: Balita[];
  imunisasiList: ImunisasiRecord[];
  pertumbuhanList?: any[];
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  session,
  onNavigateTab,
  ibuHamilList,
  balitaList,
  imunisasiList,
}) => {
  // State Jadwal Posyandu (Sinkron dengan Warga)
  const [jadwalList, setJadwalList] = useState<JadwalPosyandu[]>(() => storageService.getJadwal());
  const [showAddJadwalModal, setShowAddJadwalModal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({
    judul: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '08:30 - 11:30 WIB',
    lokasi: 'Balai Posyandu Desa',
    kategori: 'Semua' as 'Semua' | 'Ibu Hamil' | 'Balita & Imunisasi',
    keterangan: 'Membawa Buku KIA dan kartu identitas keluarga.',
    petugas: session?.name || 'Kader Posyandu',
  });

  const refreshJadwal = () => {
    setJadwalList(storageService.getJadwal());
  };

  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalForm.judul || !jadwalForm.tanggal) {
      alert('Mohon lengkapi judul dan tanggal kegiatan.');
      return;
    }

    storageService.saveJadwal(jadwalForm);
    refreshJadwal();
    setShowAddJadwalModal(false);
    setJadwalForm({
      judul: '',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: '08:30 - 11:30 WIB',
      lokasi: 'Balai Posyandu Desa',
      kategori: 'Semua',
      keterangan: 'Membawa Buku KIA dan kartu identitas keluarga.',
      petugas: session?.name || 'Kader Posyandu',
    });
    alert('Jadwal kegiatan berhasil disimpan & langsung sinkron ke akun warga!');
  };

  const handleDeleteJadwal = (id: string, judul: string) => {
    if (confirm(`Hapus jadwal kegiatan "${judul}"?`)) {
      storageService.deleteJadwal(id);
      refreshJadwal();
    }
  };

  // Perhitungan statistik real-time
  const todayStr = new Date().toISOString().split('T')[0];
  const formatHariTanggal = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  const hariTanggalHariIni = formatHariTanggal(todayStr);

  // Rekam vaksinasi sesi hari ini (reset dari 0 setiap ganti hari, riwayat tetap tersimpan di akun/database)
  const vaksinasiHariIni = imunisasiList.filter((v) => v.tanggalDiberikan === todayStr).length;

  const ibuTrimester3 = ibuHamilList.filter((ibu) => {
    const calc = hitungHPLdanUsiaKehamilan(ibu.hpht);
    return calc && calc.trimester === 3;
  }).length;

  const ibuRisikoTinggi = ibuHamilList.filter(
    (ibu) => ibu.statusResiko === 'Tinggi' || ibu.statusResiko === 'Sangat Tinggi'
  ).length;

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Hero Welcome Banner Petugas */}
      <div className="relative rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-6 sm:p-10 text-white shadow-xl shadow-teal-800/20 overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Panel Pengelolaan Petugas ({session?.role === 'admin' ? 'Administrator' : 'Kader Posyandu'})</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
              <Calendar className="w-3.5 h-3.5 text-emerald-200" />
              <span>{hariTanggalHariIni}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Pusat Kendali & Layanan Posyandu
          </h1>
          <p className="text-sm sm:text-base text-teal-100 mt-2 leading-relaxed">
            Kelola data registrasi pasien, kalkulasi HPL, riwayat vaksinasi balita, serta atur jadwal pelayanan yang otomatis terhubung ke akun warga.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateTab('ibuHamil')}
              className="px-5 py-2.5 rounded-2xl bg-white text-teal-800 font-extrabold text-xs sm:text-sm shadow-md hover:bg-teal-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Kelola Ibu Hamil & HPL</span>
            </button>
            <button
              onClick={() => onNavigateTab('imunisasi')}
              className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md border border-white/30 active:scale-95 transition-all flex items-center gap-2"
            >
              <Baby className="w-4 h-4" />
              <span>Kelola Balita & Imunisasi</span>
            </button>
            <button
              onClick={() => setShowAddJadwalModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Jadwalkan Pelayanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ibu Hamil */}
        <div 
          onClick={() => onNavigateTab('ibuHamil')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Ibu Hamil</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {ibuHamilList.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {ibuRisikoTinggi} terdeteksi risiko tinggi
          </p>
        </div>

        {/* Card 2: Menuju Kelahiran / Trimester 3 */}
        <div 
          onClick={() => onNavigateTab('ibuHamil')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Siap Melahirkan</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {ibuTrimester3}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Trimester 3 (HPL segera tiba)
          </p>
        </div>

        {/* Card 3: Balita Terdaftar */}
        <div 
          onClick={() => onNavigateTab('imunisasi')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Balita Terdaftar</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Baby className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {balitaList.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Data pemantauan tumbuh kembang
          </p>
        </div>

        {/* Card 4: Vaksinasi Hari Ini (Reset Tiap Hari Baru, Data Riwayat Tetap Tersimpan) */}
        <div 
          onClick={() => onNavigateTab('imunisasi')}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <span>Vaksinasi Hari Ini</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Syringe className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {vaksinasiHariIni}
          </div>
          <div className="mt-1 flex flex-col gap-0.5 text-[11px]">
            <span className="text-emerald-700 font-semibold truncate">
              {hariTanggalHariIni}
            </span>
            <span className="text-slate-400">
              Total riwayat: {imunisasiList.length} vaksin tersimpan
            </span>
          </div>
        </div>
      </div>

      {/* ================= MANAJEMEN JADWAL KEGIATAN (SINKRON KE WARGA) ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-lg text-slate-800">
                Jadwal Kegiatan & Pelayanan Posyandu
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tersinkron Otomatis ke Akun Orang Tua
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur jadwal penimbangan, vaksinasi, dan pemeriksaan ibu hamil yang akan langsung muncul di akun setiap warga.
            </p>
          </div>

          <button
            onClick={() => setShowAddJadwalModal(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jadwal Baru</span>
          </button>
        </div>

        {/* Daftar Jadwal */}
        {jadwalList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Belum ada jadwal kegiatan posyandu yang diatur.
            </p>
            <button
              onClick={() => setShowAddJadwalModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs inline-flex items-center gap-1 mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Jadwal Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jadwalList.map((jdw) => (
              <div
                key={jdw.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      jdw.kategori === 'Ibu Hamil'
                        ? 'bg-rose-100 text-rose-800'
                        : jdw.kategori === 'Balita & Imunisasi'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {jdw.kategori}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Petugas: {jdw.petugas}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-slate-800">
                    {jdw.judul}
                  </h4>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <strong className="text-slate-800">{formatTanggalIndo(jdw.tanggal)}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{jdw.waktu}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{jdw.lokasi}</span>
                    </div>
                    {jdw.keterangan && (
                      <p className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 mt-2">
                        {jdw.keterangan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleDeleteJadwal(jdw.id, jdw.judul)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Jadwal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Tambah Jadwal Kegiatan Baru */}
      {showAddJadwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg my-8 overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-teal-700 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="font-bold text-lg">Tambah Jadwal Pelayanan Posyandu</h3>
              </div>
              <button
                onClick={() => setShowAddJadwalModal(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJadwal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kegiatan / Pelayanan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Posyandu Rutin Balita & Imunisasi Campak"
                  value={jadwalForm.judul}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="date"
                    required
                    value={jadwalForm.tanggal}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam / Waktu Pelaksanaan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08:30 - 11:30 WIB"
                    value={jadwalForm.waktu}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, waktu: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Pelayanan
                  </label>
                  <select
                    value={jadwalForm.kategori}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, kategori: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                  >
                    <option value="Semua">Semua Sasaran (Umum)</option>
                    <option value="Ibu Hamil">Khusus Ibu Hamil</option>
                    <option value="Balita & Imunisasi">Khusus Balita & Imunisasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Petugas / Kader
                  </label>
                  <input
                    type="text"
                    value={jadwalForm.petugas}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, petugas: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokasi Posyandu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Balai RW 03 / Posyandu Melati Dusun Krajan"
                  value={jadwalForm.lokasi}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, lokasi: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Perlengkapan yang Harus Dibawa Warga
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Harap membawa Buku KIA dan fotokopi KK..."
                  value={jadwalForm.keterangan}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddJadwalModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  Simpan & Sinkronkan ke Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
