import React, { useState } from 'react';
import type { UserRole, UserSession, IbuHamil, Balita } from '../types';
import { storageService } from '../services/storage';
import { 
  Heart, 
  Baby, 
  Syringe, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Clock, 
  Apple, 
  ShieldAlert, 
  BookOpen, 
  Activity,
  LogIn
} from 'lucide-react';

interface LandingLoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  onExploreAsGuest?: () => void;
  ibuHamilList: IbuHamil[];
  balitaList: Balita[];
}

export const LandingLoginView: React.FC<LandingLoginViewProps> = ({
  onLoginSuccess,
}) => {
  // Tab Login Peran: Warga (NIK) atau Petugas (Kader/Admin)
  const [authTab, setAuthTab] = useState<'warga' | 'petugas'>('warga');

  // Tab Edukasi: Ibu Hamil atau Imunisasi
  const [eduTab, setEduTab] = useState<'ibuHamil' | 'imunisasi'>('ibuHamil');

  // Form Warga
  const [nikInput, setNikInput] = useState('');

  // Form Petugas
  const [petugasRole, setPetugasRole] = useState<'kader' | 'admin'>('kader');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleWargaLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanNik = nikInput.trim();
    if (!cleanNik) {
      setErrorMsg('Mohon masukkan NIK KTP Anda.');
      return;
    }
    if (cleanNik.length < 6) {
      setErrorMsg('NIK harus terdiri dari minimal 6 hingga 16 digit.');
      return;
    }

    // Validasi ketat: HANYA NIK YANG SUDAH TERDAFTAR OLEH ADMIN/KADER YANG BISA MASUK
    const registeredCheck = storageService.findRegisteredWargaByNik(cleanNik);
    if (!registeredCheck.registered) {
      setErrorMsg(
        `NIK ${cleanNik} belum terdaftar di sistem Posyandu! Pendaftaran NIK hanya dapat dilakukan oleh Admin atau Kader Posyandu saat pemeriksaan.`
      );
      return;
    }

    onLoginSuccess({
      role: 'warga',
      name: registeredCheck.name,
      nik: cleanNik,
    });
  };

  const handlePetugasLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (petugasRole === 'admin') {
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        onLoginSuccess({
          role: 'admin',
          name: 'Administrator Posyandu',
          username: 'admin',
        });
      } else {
        setErrorMsg('Username atau password Admin salah! Silakan periksa kembali.');
      }
    } else {
      if (username.toLowerCase() === 'kader' && password === 'kader123') {
        onLoginSuccess({
          role: 'kader',
          name: 'Kader Posyandu Desa',
          username: 'kader',
        });
      } else {
        setErrorMsg('Username atau password Kader salah! Silakan periksa kembali.');
      }
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* ================= HERO & INTEGRATED LOGIN BOX ================= */}
      <section className="bg-white rounded-3xl sm:rounded-[36px] border border-slate-200/80 shadow-sm overflow-hidden p-5 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Kolom Kiri: Ilustrasi Bayi & Salam Pembuka */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Portal Terpadu Kesehatan Ibu Hamil & Balita</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight leading-tight">
              Tumbuh Sehat, Bahagia Bersama <span className="text-teal-600">Posyandu Digital</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              Platform ramah keluarga untuk memantau usia kehamilan, tanggal perkiraan persalinan (HPL), jadwal imunisasi balita lengkap, serta panduan kesehatan terpercaya.
            </p>

            {/* Gambar Bayi yang Menarik & Bersih (Murni Foto Tanpa Teks) */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-teal-100 group">
              <img
                src="/baby.jpg"
                alt="Foto Bayi Sehat Posyandu"
                className="w-full h-56 sm:h-72 object-cover group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end p-4 sm:p-6">
                <div className="text-white">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300 block mb-0.5">
                    Generasi Bebas Stunting
                  </span>
                  <p className="text-sm sm:text-base font-extrabold">
                    Setiap senyuman buah hati adalah masa depan bangsa yang cemerlang
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="block text-xl font-black text-teal-700">Desa Kedung Jaya</span>
                <span className="text-[11px] text-slate-500 font-semibold">Berbasis Digital</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="block text-xl font-black text-rose-600">Rumus Naegele</span>
                <span className="text-[11px] text-slate-500 font-semibold">Kalkulator HPL</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="block text-xl font-black text-indigo-600">Khusus Terdaftar</span>
                <span className="text-[11px] text-slate-500 font-semibold">Login NIK Warga</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kotak Masuk / Login Interaktif (Harus Input, Tanpa Coba) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-lg text-slate-800">Masuk ke Layanan</h3>
                <p className="text-xs text-slate-500">Pilih jenis akun Anda untuk masuk</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <LogIn className="w-5 h-5" />
              </div>
            </div>

            {/* Tab Selector: Orang Tua (NIK) vs Petugas */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl mt-4">
              <button
                onClick={() => {
                  setAuthTab('warga');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'warga'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Orang Tua (NIK)</span>
              </button>
              <button
                onClick={() => {
                  setAuthTab('petugas');
                  setErrorMsg('');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authTab === 'petugas'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Kader / Admin</span>
              </button>
            </div>

            {/* Pesan Kesalahan */}
            {errorMsg && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* FORM 1: ORANG TUA / WARGA (HANYA NIK YANG SUDAH TERDAFTAR) */}
            {authTab === 'warga' ? (
              <form onSubmit={handleWargaLogin} className="mt-5 space-y-4">
                <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3 text-xs text-teal-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-teal-800">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Hanya untuk Orang Tua Terdaftar</span>
                  </p>
                  <span>Masukkan <strong>NIK</strong> yang telah didaftarkan oleh Kader/Admin Posyandu untuk mengakses buku kesehatan keluarga Anda.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Induk Kependudukan (NIK Terdaftar) *
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={16}
                      value={nikInput}
                      onChange={(e) => setNikInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Masukkan 16 digit NIK..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {nikInput.length}/16 digit NIK
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Masuk ke Halaman Orang Tua</span>
                </button>
              </form>
            ) : (
              /* FORM 2: PETUGAS (KADER & ADMIN) */
              <form onSubmit={handlePetugasLogin} className="mt-5 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPetugasRole('kader');
                      setUsername('');
                      setPassword('');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      petugasRole === 'kader'
                        ? 'bg-teal-50 border-teal-500 text-teal-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Kader Posyandu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPetugasRole('admin');
                      setUsername('');
                      setPassword('');
                      setErrorMsg('');
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      petugasRole === 'admin'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Administrator
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Petugas
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={petugasRole === 'admin' ? 'Masukkan username admin' : 'Masukkan username kader'}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-100 text-[11px] text-slate-600">
                  Default login: Kader (<code className="font-mono bg-white px-1">kader</code> / <code className="font-mono bg-white px-1">kader123</code>), Admin (<code className="font-mono bg-white px-1">admin</code> / <code className="font-mono bg-white px-1">admin123</code>)
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Masuk sebagai {petugasRole === 'admin' ? 'Admin' : 'Kader'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ================= SECTION MATERI EDUKASI INTERAKTIF ================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-teal-700 text-xs font-extrabold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Edukasi Kesehatan Masyarakat</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Panduan Penting untuk Orang Tua & Ibu Hamil
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Informasi medis praktis yang dapat langsung dibaca oleh orang tua di ponsel pintar.
            </p>
          </div>

          {/* Toggle Tab Edukasi */}
          <div className="flex gap-2 bg-slate-200/80 p-1.5 rounded-2xl self-start sm:self-auto">
            <button
              onClick={() => setEduTab('ibuHamil')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                eduTab === 'ibuHamil'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Materi Ibu Hamil</span>
            </button>
            <button
              onClick={() => setEduTab('imunisasi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                eduTab === 'imunisasi'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Syringe className="w-4 h-4" />
              <span>Materi Imunisasi Balita</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: MATERI IBU HAMIL ================= */}
        {eduTab === 'ibuHamil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Perkembangan 3 Trimester Kehamilan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Setiap tahapan kehamilan memiliki kebutuhan dan tanda perkembangan yang unik:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                  <strong className="text-rose-900 block">Trimester 1 (Mg 1 - 12):</strong>
                  Pembentukan organ vital & sistem saraf janin. Minum Asam Folat untuk mencegah cacat tabung saraf.
                </li>
                <li className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                  <strong className="text-rose-900 block">Trimester 2 (Mg 13 - 27):</strong>
                  Masa pertumbuhan pesat janin. Gerakan bayi mulai terasa lembut, detak jantung semakin kuat.
                </li>
                <li className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                  <strong className="text-rose-900 block">Trimester 3 (Mg 28 - 40):</strong>
                  Persiapan persalinan. Kepala bayi mulai turun ke panggul. Waspadai tanda persalinan awal!
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Apple className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Nutrisi & Suplemen Wajib Ibu Hamil
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Asupan gizi seimbang menentukan kesehatan fisik dan kecerdasan otak bayi:
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Tablet Tambah Darah (Fe):</strong> Minimal 90 tablet selama kehamilan untuk cegah anemia & pendarahan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Kalsium & Vitamin D:</strong> Pembentukan tulang dan gigi janin serta mencegah osteoporosis pada ibu.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Protein Hewani:</strong> Telur, ikan kembung, daging tanpa lemak untuk pertumbuhan sel tubuh janin.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Cairan Cukup:</strong> Minum air putih 2-3 liter per hari untuk menjaga volume air ketuban.</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Tanda Bahaya & Persiapan Persalinan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Segera hubungi Bidan Desa atau Puskesmas jika mengalami salah satu tanda berikut:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-red-700 font-medium mb-4">
                <li>Pendarahan dari jalan lahir (vagina)</li>
                <li>Bengkak pada wajah, kaki, dan tangan disertai pusing berat</li>
                <li>Gerakan janin berkurang atau tidak terasa sama sekali</li>
                <li>Keluar cairan ketuban sebelum waktunya</li>
                <li>Demam tinggi atau kejang-kejang</li>
              </ul>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <strong>Tips Siaga P4K:</strong> Siapkan KTP, BPJS, pakaian bayi, kendaraan siaga, dan calon pendonor darah keluarga sebelum HPL tiba.
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MATERI IMUNISASI BALITA ================= */}
        {eduTab === 'imunisasi' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Syringe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Mengapa Imunisasi Wajib Diberikan?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Imunisasi melatih sistem kekebalan tubuh anak menghasilkan antibodi tanpa harus menderita penyakit terlebih dahulu.
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
                  <strong className="text-teal-900 block">Kekebalan Kelompok (Herd Immunity):</strong>
                  Jika lebih dari 95% balita diimunisasi, penyakit berbahaya tidak akan dapat menular di lingkungan desa.
                </div>
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
                  <strong className="text-teal-900 block">Perlindungan Seumur Hidup:</strong>
                  Mencegah kelumpuhan akibat Polio, radang paru Pneumonia (PCV), dan kebutaan akibat Campak.
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Jadwal Vaksinasi Usia 0 - 24 Bulan
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Pedoman imunisasi dasar lengkap sesuai rekomendasi Kementerian Kesehatan RI:
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">0 Bulan (Saat Lahir):</span>
                  <span className="font-bold text-teal-700">Hepatitis B (HB-0)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">1 Bulan:</span>
                  <span className="font-bold text-teal-700">BCG & Polio 1</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">2 - 4 Bulan:</span>
                  <span className="font-bold text-teal-700">DPT-HB-Hib, Polio, PCV, IPV</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">9 Bulan:</span>
                  <span className="font-bold text-teal-700">Campak-Rubella (MR 1)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-700">18 Bulan (Booster):</span>
                  <span className="font-bold text-teal-700">DPT Lanjutan & MR 2</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Cegah Stunting pada 1000 Hari Pertama
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Stunting adalah kondisi gagal tumbuh pada balita akibat kekurangan gizi kronis dalam 1000 hari pertama sejak janin:
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                  <span><strong>ASI Eksklusif 6 Bulan:</strong> Jangan berikan makanan atau air selain ASI sampai bayi genap berusia 6 bulan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                  <span><strong>MPASI Kaya Protein Hewani:</strong> Mulai usia 6 bulan, beri bubur dengan hati ayam, telur, atau ikan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                  <span><strong>Rutin Timbang di Posyandu:</strong> Pantau kurva KMS tiap bulan untuk mendeteksi gagal tumbuh sedini mungkin.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
