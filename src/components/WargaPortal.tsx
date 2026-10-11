import React, { useState, useEffect } from 'react';
import type { UserSession, IbuHamil, Balita, ImunisasiRecord, PertumbuhanRecord, JadwalPosyandu } from '../types';
import { 
  storageService,
  hitungHPLdanUsiaKehamilan, 
  formatTanggalIndo, 
  hitungUsiaBulan 
} from '../services/storage';
import { 
  Heart, 
  Baby, 
  Syringe, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Apple, 
  ShieldAlert, 
  BookOpen, 
  TrendingUp,
  User,
  Info,
  MapPin,
  Smile,
  Milk,
  Utensils,
  Award,
  Trash2
} from 'lucide-react';

interface WargaPortalProps {
  session: UserSession | null;
  ibuHamilList: IbuHamil[];
  balitaList: Balita[];
  imunisasiList: ImunisasiRecord[];
  pertumbuhanList: PertumbuhanRecord[];
  onLoginRequest: () => void;
  onRefresh?: () => void;
}

export const WargaPortal: React.FC<WargaPortalProps> = ({
  session,
  ibuHamilList,
  balitaList,
  imunisasiList,
  pertumbuhanList,
  onLoginRequest,
  onRefresh,
}) => {
  const [familySearchQuery, setFamilySearchQuery] = useState('');
  const [activeTabWarga, setActiveTabWarga] = useState<'kesehatan' | 'jadwal' | 'panduan'>('kesehatan');
  const [selectedService, setSelectedService] = useState<'semua' | 'ibuHamil' | 'balita'>('semua');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [materiCategory, setMateriCategory] = useState<'ibuHamil' | 'bayi'>('bayi');
  const [activeMateriDetail, setActiveMateriDetail] = useState<'nifas' | 'asi' | 'mpasi' | 'stimulasi' | 'kipi' | 'trimester' | 'nutrisiBumil' | 'tandaBahayaBumil'>('asi');

  // Ambil jadwal yang disinkronkan dari Admin
  const [jadwalList, setJadwalList] = useState<JadwalPosyandu[]>([]);

  useEffect(() => {
    setJadwalList(storageService.getJadwal());
  }, []);

  const currentNik = session?.nik?.trim() || '';

  // Data Kehamilan Pribadi
  const myPregnancyData = ibuHamilList.find((i) => i.nik.trim() === currentNik);

  // Data Balita Pribadi
  const myChildrenList = balitaList.filter(
    (b) => (b.nikIbu && b.nikIbu.trim() === currentNik) || (b.nik && b.nik.trim() === currentNik)
  );

  // Filter pencarian anak di dalam keluarga
  const filteredChildren = myChildrenList.filter((b) => {
    const q = familySearchQuery.toLowerCase().trim();
    if (!q) return true;
    return b.nama.toLowerCase().includes(q) || (b.nik && b.nik.includes(q));
  });

  const displayedChildren = selectedChildId === 'all' 
    ? filteredChildren 
    : filteredChildren.filter((c) => c.id === selectedChildId);

  const handleDeleteMyImunisasi = (id: string, vaksin: string) => {
    if (confirm(`Hapus catatan vaksinasi "${vaksin}" ini dari buku KMS?`)) {
      storageService.deleteImunisasi(id);
      onRefresh?.();
    }
  };

  const handleDeleteMyPertumbuhan = (id: string) => {
    if (confirm('Hapus catatan pengukuran tubuh ini dari buku KMS?')) {
      storageService.deletePertumbuhan(id);
      onRefresh?.();
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">
          Portal Kesehatan Pribadi Orang Tua
        </h2>
        <p className="text-sm text-slate-600">
          Untuk menjaga kerahasiaan data medis keluarga, silakan masuk menggunakan <strong>NIK KTP Terdaftar</strong> Anda.
        </p>
        <button
          onClick={onLoginRequest}
          className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span>Masuk dengan NIK Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 sm:pb-10">
      {/* ================= GREETING HEADER KHUSUS ORANG TUA ================= */}
      <section className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 rounded-3xl sm:rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-teal-700/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Halaman Mandiri Orang Tua</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            Halo, Selamat Datang, {session.name}! 👋
          </h1>

          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
            Ini adalah buku kesehatan digital khusus untuk Anda dan buah hati Anda. Data ini hanya dapat diakses oleh akun Anda dan tersimpan dengan aman.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-black/20 px-3 py-1 rounded-xl font-mono text-teal-200">
              NIK Akun: {session.nik || '-'}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-xl font-bold">
              Akun Keluarga Terdaftar
            </span>
          </div>

          {/* Sub Navigation Bar untuk Orang Tua */}
          <div className="pt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTabWarga('kesehatan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabWarga === 'kesehatan'
                  ? 'bg-white text-teal-800 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Buku Kesehatan Keluarga</span>
            </button>

            <button
              onClick={() => setActiveTabWarga('jadwal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabWarga === 'jadwal'
                  ? 'bg-white text-teal-800 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jadwal Posyandu ({jadwalList.length})</span>
            </button>

            <button
              onClick={() => setActiveTabWarga('panduan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTabWarga === 'panduan'
                  ? 'bg-white text-teal-800 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Materi & Panduan Khusus</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= TAB 1: BUKU KESEHATAN KELUARGA (HANYA DATA SENDIRI) ================= */}
      {activeTabWarga === 'kesehatan' && (
        <div className="space-y-6">
          {/* PILIHAN LAYANAN KELUARGA (PILIH KE IBU HAMIL ATAU DATA BAYI) */}
          <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Pilih Buku Layanan Keluarga:</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Satu akun NIK mencakup seluruh data kehamilan dan semua anak dalam keluarga Anda.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedService('semua')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedService === 'semua'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tampilkan Semua
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pilihan 1: Ibu Hamil */}
              <button
                type="button"
                onClick={() => setSelectedService('ibuHamil')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  selectedService === 'ibuHamil'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">
                      1. Buku Kesehatan Ibu Hamil
                    </span>
                    <span className="text-xs text-slate-500">
                      {myPregnancyData ? `Aktif: ${myPregnancyData.nama}` : 'Belum ada data kehamilan'}
                    </span>
                  </div>
                </div>
                {selectedService === 'ibuHamil' && (
                  <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>

              {/* Pilihan 2: Buah Hati */}
              <button
                type="button"
                onClick={() => setSelectedService('balita')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  selectedService === 'balita'
                    ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                    <Baby className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-800 block">
                      2. Buku Kesehatan Buah Hati
                    </span>
                    <span className="text-xs text-slate-500">
                      {myChildrenList.length > 0 ? `${myChildrenList.length} Anak Terdaftar di Akun Ini` : 'Belum ada anak terdaftar'}
                    </span>
                  </div>
                </div>
                {selectedService === 'balita' && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                )}
              </button>
            </div>
          </section>

          {/* Kotak Filter & Pilihan Anak (Jika ada 2+ anak dalam 1 keluarga) */}
          {(selectedService === 'balita' || selectedService === 'semua') && myChildrenList.length > 1 && (
            <section className="bg-teal-50/80 rounded-3xl p-4 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-teal-900">
                  Pilih Data Anak ({myChildrenList.length} Anak dalam 1 Keluarga):
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedChildId('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedChildId === 'all'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  Semua Anak ({myChildrenList.length})
                </button>
                {myChildrenList.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChildId(ch.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedChildId === ch.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white text-teal-800 hover:bg-teal-100'
                    }`}
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>Anak {idx + 1}: {ch.nama}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Kotak Filter Pencarian Anak Keluarga */}
          {(selectedService === 'balita' || selectedService === 'semua') && (
            <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Pencarian Kartu Buah Hati
                </h3>
                <p className="text-xs text-slate-400">
                  Cari berdasarkan nama anak atau Nomor Registrasi/NIK anak Anda
                </p>
              </div>

              <div className="relative sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anak atau NIK..."
                  value={familySearchQuery}
                  onChange={(e) => setFamilySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </section>
          )}

          {/* Kartu Ibu Hamil Pribadi */}
          {(selectedService === 'ibuHamil' || selectedService === 'semua') && myPregnancyData && (
            <section className="bg-white rounded-3xl border border-rose-200/90 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-slate-800">
                        Buku Kehamilan: {myPregnancyData.nama}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Ibu Hamil
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Suami: {myPregnancyData.namaSuami || '-'} • Usia: {myPregnancyData.usia} Tahun
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase self-start sm:self-auto border ${
                    myPregnancyData.statusResiko === 'Sangat Tinggi'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : myPregnancyData.statusResiko === 'Tinggi'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  Status: Risiko {myPregnancyData.statusResiko}
                </span>
              </div>

              {(() => {
                const pregInfo = hitungHPLdanUsiaKehamilan(myPregnancyData.hpht);
                if (!pregInfo) return null;

                return (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-5 rounded-3xl border border-rose-200/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block">
                            Hari Perkiraan Lahir (HPL Anda):
                          </span>
                          <h4 className="text-xl sm:text-2xl font-extrabold text-rose-950">
                            {pregInfo.hplDateFormatted}
                          </h4>
                          <p className="text-xs text-rose-700 mt-0.5 font-medium">
                            {pregInfo.statusDesc}
                          </p>
                        </div>

                        <div className="sm:text-right bg-white p-3.5 rounded-2xl border border-rose-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 block font-semibold">
                            Countdown Persalinan:
                          </span>
                          <span className="text-2xl font-black text-rose-600 block">
                            {pregInfo.daysRemaining > 0 ? `${pregInfo.daysRemaining} Hari Lagi` : 'Waktu Bersalin Tiba!'}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">
                            Usia: {pregInfo.gestationalWeeks} Minggu {pregInfo.gestationalDays} Hari
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold mb-1.5">
                          <span>HPHT: {formatTanggalIndo(myPregnancyData.hpht)}</span>
                          <span>Perjalanan Kehamilan ({pregInfo.progressPercent}%)</span>
                        </div>
                        <div className="w-full bg-rose-200/60 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-rose-500 to-pink-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${pregInfo.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-teal-600" />
                        <span>Catatan Pemeriksaan Rutin dari Bidan/Kader ({myPregnancyData.riwayatPemeriksaan?.length || 0})</span>
                      </h4>

                      {(!myPregnancyData.riwayatPemeriksaan || myPregnancyData.riwayatPemeriksaan.length === 0) ? (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                          Belum ada catatan pemeriksaan kehamilan yang diinput oleh kader Posyandu.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {myPregnancyData.riwayatPemeriksaan.map((pem, idx) => (
                            <div key={pem.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                              <div className="flex justify-between font-bold text-slate-800">
                                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                  {formatTanggalIndo(pem.tanggal)} ({pem.usiaKehamilanMinggu} Minggu)
                                </span>
                                <span className="text-slate-500">
                                  TD: {pem.tekananDarah} • BB: {pem.beratBadanKg} kg
                                </span>
                              </div>
                              <div className="text-slate-600 pt-1">
                                <p><strong>Keluhan:</strong> {pem.keluhan}</p>
                                <p><strong>Tindakan / Vitamin:</strong> {pem.tindakan}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </section>
          )}

          {/* Kartu Balita Pribadi */}
          {(selectedService === 'balita' || selectedService === 'semua') && displayedChildren.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-extrabold text-slate-800">
                  Buku KMS & Imunisasi Buah Hati ({displayedChildren.length} dari {myChildrenList.length} Anak Terdaftar)
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {displayedChildren.map((balita) => {
                  const usiaBln = hitungUsiaBulan(balita.tanggalLahir);
                  const vaxList = imunisasiList.filter((i) => i.balitaId === balita.id);
                  const tmbList = pertumbuhanList.filter((p) => p.balitaId === balita.id);
                  const latestTumbuh = tmbList[0];

                  return (
                    <div
                      key={balita.id}
                      className="bg-white rounded-3xl border border-teal-200/90 p-6 sm:p-8 shadow-sm space-y-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-teal-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-bold text-slate-800">{balita.nama}</h4>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                              {usiaBln} Bulan
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            No. Registrasi / NIK: <strong>{balita.nik || 'Terdaftar di Posyandu'}</strong> • Lahir: {formatTanggalIndo(balita.tanggalLahir)} ({balita.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'})
                          </p>
                        </div>

                        {latestTumbuh && (
                          <div className="bg-teal-50 px-3.5 py-2 rounded-2xl border border-teal-200 text-xs">
                            <span className="text-slate-500 block">Kondisi Pertumbuhan Terakhir:</span>
                            <strong className="text-teal-900 text-sm">
                              BB {latestTumbuh.beratBadanKg} kg • TB {latestTumbuh.tinggiBadanCm} cm ({latestTumbuh.statusGizi})
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Vaksin yang Diterima */}
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                          <Syringe className="w-4 h-4 text-teal-600" />
                          <span>Vaksin yang Sudah Diterima ({vaxList.length})</span>
                        </h5>

                        {vaxList.length === 0 ? (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                            <Info className="w-4 h-4 shrink-0" />
                            <span>Belum ada rekam vaksinasi yang dicatat. Bawa buah hati saat jadwal imunisasi Posyandu berikutnya.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {vaxList.map((vx) => (
                              <div key={vx.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <span className="font-bold text-slate-800 block">{vx.jenisVaksin}</span>
                                    <span className="text-[11px] text-slate-400">Usia {vx.usiaBulanSaatDiberikan} Bulan</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {formatTanggalIndo(vx.tanggalDiberikan)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMyImunisasi(vx.id, vx.jenisVaksin)}
                                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Hapus Rekam Vaksin"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* KMS Fisik */}
                      {tmbList.length > 0 && (
                        <div>
                          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span>Catatan Penimbangan & Pengukuran Fisik</span>
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold">
                                  <th className="p-2.5 rounded-l-xl">Tanggal</th>
                                  <th className="p-2.5">Usia</th>
                                  <th className="p-2.5">Berat Badan</th>
                                  <th className="p-2.5">Tinggi Badan</th>
                                  <th className="p-2.5">LK / LD</th>
                                  <th className="p-2.5">Status Gizi</th>
                                  <th className="p-2.5 rounded-r-xl text-center">Aksi</th>
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
                                      <span className="px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                                        {tm.statusGizi}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMyPertumbuhan(tm.id)}
                                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        title="Hapus Rekam Pengukuran"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!myPregnancyData && myChildrenList.length === 0 && (
            <section className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center shadow-xs max-w-xl mx-auto space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Data Medis Anda Sedang Diproses
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kader Posyandu belum memasukkan riwayat pemeriksaan kehamilan atau balita Anda untuk NIK ({currentNik}). Data Anda akan otomatis muncul di sini segera setelah ditimbang atau diperiksa oleh kader.
              </p>
            </section>
          )}
        </div>
      )}

      {/* ================= TAB 2: JADWAL POSYANDU SINKRON DARI ADMIN ================= */}
      {activeTabWarga === 'jadwal' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Jadwal Kegiatan & Pelayanan Posyandu Anda</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Jadwal ini diatur langsung oleh Admin & Bidan Desa dan disinkronkan secara otomatis untuk keluarga Anda.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              Aktif & Terhubung
            </span>
          </div>

          {jadwalList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p>Belum ada jadwal kegiatan baru yang ditetapkan oleh Bidan atau Kader Desa saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jadwalList.map((jdw) => (
                <div
                  key={jdw.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/30 border border-slate-200 hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      jdw.kategori === 'Ibu Hamil'
                        ? 'bg-rose-100 text-rose-800'
                        : jdw.kategori === 'Balita & Imunisasi'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {jdw.kategori}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Petugas: {jdw.petugas}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-slate-800">
                    {jdw.judul}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                      <strong className="text-slate-800 text-sm">{formatTanggalIndo(jdw.tanggal)}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{jdw.waktu}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{jdw.lokasi}</span>
                    </div>
                  </div>

                  {jdw.keterangan && (
                    <div className="p-3 rounded-xl bg-white border border-teal-100 text-xs text-teal-900">
                      <strong>Perlengkapan yang perlu dibawa:</strong> {jdw.keterangan}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= TAB 3: PANDUAN & EDUKASI KHUSUS ORANG TUA (BEDA DARI HALAMAN AWAL) ================= */}
      {activeTabWarga === 'panduan' && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 text-teal-700 text-xs font-extrabold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Panduan Praktis Orang Tua</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Edukasi Mendalam Perawatan Ibu & Perkembangan Balita
            </h3>
            <p className="text-xs text-slate-500">
              Materi komprehensif yang dirancang khusus untuk dibaca mandiri oleh orang tua di rumah.
            </p>
          </div>

          {/* Switcher Kategori Materi: Ibu Hamil vs Bayi & Balita */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => {
                setMateriCategory('ibuHamil');
                setActiveMateriDetail('trimester');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                materiCategory === 'ibuHamil'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Materi Khusus Ibu Hamil & Nifas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMateriCategory('bayi');
                setActiveMateriDetail('asi');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                materiCategory === 'bayi'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Baby className="w-4 h-4" />
              <span>Materi Khusus Bayi & Balita</span>
            </button>
          </div>

          {/* Sub Tab Materi Berdasarkan Kategori yang Dipilih */}
          {materiCategory === 'ibuHamil' ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveMateriDetail('trimester')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'trimester'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>1. Perkembangan 3 Trimester</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('nutrisiBumil')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'nutrisiBumil'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>2. Nutrisi & Tablet Tambah Darah</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('tandaBahayaBumil')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'tandaBahayaBumil'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>3. Tanda Bahaya Kehamilan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('nifas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'nifas'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>4. Masa Nifas & Kesehatan Mental</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveMateriDetail('asi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'asi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Milk className="w-3.5 h-3.5" />
                <span>1. Sukses ASI Eksklusif</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('mpasi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'mpasi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>2. Tahapan MPASI Anti-Stunting</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('stimulasi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'stimulasi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>3. Stimulasi Milestone Usia 0-24 Bulan</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMateriDetail('kipi')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeMateriDetail === 'kipi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Syringe className="w-3.5 h-3.5" />
                <span>4. Panduan Obat & Demam Pasca Vaksin</span>
              </button>
            </div>
          )}

          {/* KONTEN DETAIL: TRIMESTER KEHAMILAN */}
          {activeMateriDetail === 'trimester' && (
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
              <h4 className="font-extrabold text-base text-rose-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-600" />
                <span>Tahapan Perkembangan Janin 3 Trimester Kehamilan</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block font-bold">Trimester 1 (Minggu 1 - 12):</strong>
                  <p>Pembentukan organ vital janin (otak, jantung, dan tulang belakang). Ibu sering mengalami *morning sickness* (mual/muntah). Wajib konsumsi <strong>Asam Folat</strong> setiap hari untuk mencegah cacat tabung saraf.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block font-bold">Trimester 2 (Minggu 13 - 27):</strong>
                  <p>Masa keemasan kehamilan, mual mulai mereda. Janin mulai bisa mendengar dan aktif menendang (mulai terasa di minggu ke 18-20). Mulai konsumsi Tablet Tambah Darah (TTD) dan Kalsium secara teratur.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block font-bold">Trimester 3 (Minggu 28 - 40):</strong>
                  <p>Pematangan paru-paru dan penambahan berat janin. Posisi kepala mulai turun ke panggul. Hitung gerakan janin (minimal 10 gerakan dalam 12 jam) dan siapkan perlengkapan persalinan serta Buku KIA.</p>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL: NUTRISI & TABLET TAMBAH DARAH */}
          {activeMateriDetail === 'nutrisiBumil' && (
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
              <h4 className="font-extrabold text-base text-rose-950 flex items-center gap-2">
                <Apple className="w-5 h-5 text-rose-600" />
                <span>Panduan Nutrisi Gizi Seimbang & Konsumsi TTD Ibu Hamil</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block font-bold">Porsi Piring Makanku Ibu Hamil:</strong>
                  <p>- Karbohidrat kompleks (nasi merah, kentang, jagung, nasi putih).</p>
                  <p>- Protein hewani tinggi (telur 1-2 butir/hari, ikan kembung, ayam, daging sapi, hati ayam).</p>
                  <p>- Sayuran hijau gelap (bayam, brokoli, daun katuk) kaya asam folat dan zat besi.</p>
                  <p>- Buah-buahan segar bervitamin C (jeruk, pepaya, jambu) untuk memaksimalkan penyerapan zat besi.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block font-bold">Aturan Minum Tablet Tambah Darah (TTD):</strong>
                  <p>- Minum minimal 90 tablet selama kehamilan untuk mencegah Anemia dan Berat Bayi Lahir Rendah (BBLR).</p>
                  <p>- Minum 1 tablet setiap malam sebelum tidur dengan air putih atau jus jeruk untuk menghindari rasa mual.</p>
                  <p>- <strong>JANGAN</strong> minum TTD bersamaan dengan teh, kopi, atau susu karena dapat menghambat penyerapan zat besi.</p>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL: TANDA BAHAYA KEHAMILAN */}
          {activeMateriDetail === 'tandaBahayaBumil' && (
            <div className="p-6 rounded-2xl bg-red-50/70 border border-red-200 space-y-4">
              <h4 className="font-extrabold text-base text-red-950 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Tanda Bahaya Kehamilan (Segera ke Puskesmas / Rumah Sakit!)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-red-100 space-y-1.5">
                  <strong className="text-red-900 block font-bold">Gejala Darurat Medis:</strong>
                  <p>⚠️ <strong>Perdarahan Jalan Lahir:</strong> Flek maupun perdarahan banyak dapat mengindikasikan keguguran atau solusio plasenta.</p>
                  <p>⚠️ <strong>Bengkak di Wajah, Kaki, & Tangan:</strong> Disertai sakit kepala hebat, pandangan kabur, atau nyeri ulu hati (Tanda Preeklamsia).</p>
                  <p>⚠️ <strong>Gerakan Janin Melemah atau Berhenti:</strong> Kurang dari 10 kali dalam kurun waktu 12 jam pada trimester 3.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-red-100 space-y-1.5">
                  <strong className="text-red-900 block font-bold">Kondisi Kritis Lainnya:</strong>
                  <p>⚠️ <strong>Ketuban Pecah Dini:</strong> Keluar cairan bening dari jalan lahir sebelum tanda-tanda persalinan dimulai.</p>
                  <p>⚠️ <strong>Demam Tinggi & Menggigil:</strong> Indikasi infeksi yang membahayakan janin.</p>
                  <p>⚠️ <strong>Mual Muntah Terus-Menerus:</strong> Ibu tidak bisa menelan makanan/minuman dan lemas dehidrasi (*Hiperemesis*).</p>
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL 1: ASI EKSKLUSIF */}
          {activeMateriDetail === 'asi' && (
            <div className="p-6 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-4">
              <h4 className="font-extrabold text-base text-teal-900 flex items-center gap-2">
                <Milk className="w-5 h-5 text-teal-600" />
                <span>Teknik Pelekatan Menyusui & Manajemen ASI Perah</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-teal-100">
                  <strong className="text-teal-900 block mb-1">Kunci Pelekatan Benar (LATCH):</strong>
                  - Mulut bayi terbuka lebar seperti menguap.<br />
                  - Dagu bayi menempel pada payudara ibu.<br />
                  - Sebagian besar areola bawah masuk ke mulut bayi (bukan hanya puting).<br />
                  - Pipi bayi membulat dan tidak terdengar bunyi decak, melainkan suara menelan teratur.
                </div>
                <div className="p-4 bg-white rounded-xl border border-teal-100">
                  <strong className="text-teal-900 block mb-1">Penyimpanan ASI Perah (ASIP):</strong>
                  - Suhu ruang (25°C): Tahan hingga 4 jam.<br />
                  - Kulkas bawah (chiller 4°C): Tahan 4 - 5 hari.<br />
                  - Freezer kulkas 2 pintu (-18°C): Tahan 3 - 6 bulan.<br />
                  - Hindari memanaskan ASI di microwave; cukup rendam di mangkuk air hangat.
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL 2: MPASI */}
          {activeMateriDetail === 'mpasi' && (
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-4">
              <h4 className="font-extrabold text-base text-amber-950 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <span>Tekstur & Menu MPASI Anti-Stunting (Kaya Protein Hewani)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700 leading-relaxed">
                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <strong className="text-amber-900 block">Usia 6 - 8 Bulan:</strong>
                  Tekstur lumat dan saring halus (tidak terlalu cair). Frekuensi 2-3 kali sehari ditambah selingan. Utamakan telur, ati ayam, dan ikan.
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <strong className="text-amber-900 block">Usia 9 - 11 Bulan:</strong>
                  Tekstur cincang halus (*minced*) atau cincang kasar (*chopped*). Kenalkan makanan genggam (*finger food*) lunak.
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <strong className="text-amber-900 block">Usia 12 Bulan ke Atas:</strong>
                  Makanan keluarga biasa yang dipotong kecil sesuai kemampuan mengunyah anak. Tetap berikan ASI hingga 2 tahun.
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL 3: STIMULASI MILESTONE */}
          {activeMateriDetail === 'stimulasi' && (
            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
              <h4 className="font-extrabold text-base text-blue-950 flex items-center gap-2">
                <Smile className="w-5 h-5 text-blue-600" />
                <span>Tahapan Milestone & Stimulasi Perkembangan</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-blue-100 space-y-1.5">
                  <strong className="text-blue-900 block">0 - 6 Bulan (Motorik & Sensorik):</strong>
                  - Biasakan posisi tengkurap (*tummy time*) saat bayi bangun untuk melatih otot leher dan dada.<br />
                  - Ajak bicara dengan kontak mata langsung, bunyikan mainan gemerincing perlahan.<br />
                  - Red flag: Bayi tidak merespons suara keras atau mata tidak mengikuti gerakan benda.
                </div>
                <div className="p-4 bg-white rounded-xl border border-blue-100 space-y-1.5">
                  <strong className="text-blue-900 block">7 - 18 Bulan (Eksplorasi & Bahasa):</strong>
                  - Stimulasi anak meraih benda, bermain cilukba, dan bertepuk tangan.<br />
                  - Batasi layar gawai (*screen time*) 0 jam untuk anak di bawah 2 tahun agar tidak memicu *speech delay* (keterlambatan bicara).
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL 4: NIFAS */}
          {activeMateriDetail === 'nifas' && (
            <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-4">
              <h4 className="font-extrabold text-base text-rose-950 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <span>Perawatan Masa Nifas (40 Hari) & Kesehatan Mental Ibu</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 leading-relaxed">
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block">Perawatan Fisik Ibu:</strong>
                  - Ganti pembalut nifas setiap 3-4 jam untuk menjaga kebersihan jalan lahir.<br />
                  - Jangan pantang makanan protein (ikan, telur, ayam) agar luka persalinan cepat pulih.<br />
                  - Minum kapsul Vitamin A merah nifas 2 dosis (dosis 1 saat melahirkan, dosis 2 setelah 24 jam).
                </div>
                <div className="p-4 bg-white rounded-xl border border-rose-100 space-y-1.5">
                  <strong className="text-rose-900 block">Cegah Postpartum Depression (Baby Blues):</strong>
                  - Perubahan hormon dan kelelahan dapat memicu rasa sedih, cemas, atau menangis tanpa sebab.<br />
                  - Suami dan keluarga wajib membantu menggendong bayi dan memberi ibu waktu istirahat yang cukup.<br />
                  - Jika rasa sedih berlanjut lebih dari 2 minggu, segera konsultasikan ke tenaga kesehatan.
                </div>
              </div>
            </div>
          )}

          {/* KONTEN DETAIL 5: KIPI */}
          {activeMateriDetail === 'kipi' && (
            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
              <h4 className="font-extrabold text-base text-indigo-950 flex items-center gap-2">
                <Syringe className="w-5 h-5 text-indigo-600" />
                <span>Penanganan Mandiri KIPI (Demam / Bengkak Bekas Suntikan)</span>
              </h4>
              <div className="p-4 bg-white rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-2 leading-relaxed">
                <p><strong>Jika Anak Demam:</strong> Jangan selimuti tebal. Kenakan pakaian longgar berbahan katun, kompres hangat pada dahi dan lipatan paha, serta berikan sirup Parasetamol tetes sesuai dosis berat badan yang dianjurkan kader/bidan.</p>
                <p><strong>Jika Bekas Suntikan Merah / Nyeri:</strong> Kompres dingin dengan kain bersih yang dibasahi air dingin pada area suntikan. Jangan dipijat atau diolesi minyak panas.</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
