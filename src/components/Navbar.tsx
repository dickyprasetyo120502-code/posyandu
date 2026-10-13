import React from 'react';
import type { UserSession } from '../types';
import { 
  HeartHandshake, 
  User, 
  Baby, 
  Activity, 
  LogOut, 
  ShieldCheck, 
  Search,
  BookOpen,
  LayoutDashboard,
  Heart
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'landing' | 'dashboard' | 'ibuHamil' | 'imunisasi' | 'warga';
  setCurrentTab: (tab: 'landing' | 'dashboard' | 'ibuHamil' | 'imunisasi' | 'warga') => void;
  session: UserSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  totalIbu: number;
  totalBalita: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  session,
  onOpenLogin,
  onLogout,
  totalIbu,
  totalBalita,
}) => {
  const isWarga = session?.role === 'warga';
  const isPetugas = session?.role === 'admin' || session?.role === 'kader';

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div 
              onClick={() => setCurrentTab(isWarga ? 'warga' : isPetugas ? 'dashboard' : 'landing')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight">
                    Posyandu<span className="text-teal-600">Digital </span>
                  </span>
                  
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                    {isWarga ? 'Orang Tua' : isPetugas ? 'Petugas' : 'Online'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium hidden sm:block">
                  Layanan Terpadu Ibu Hamil & Imunisasi Balita Desa Kedung Jaya
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
              {/* JIKA WARGA YANG LOGIN: HANYA TAMPILKAN BUKU KESEHATAN PRIBADI & MATERI */}
              {isWarga ? (
                <>
                  <button
                    onClick={() => setCurrentTab('warga')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      currentTab === 'warga'
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span>Buku Kesehatan Keluarga Saya</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('landing')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      currentTab === 'landing'
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Materi & Panduan Ibu Hamil/Anak</span>
                  </button>
                </>
              ) : isPetugas ? (
                /* JIKA PETUGAS (KADER/ADMIN) YANG LOGIN: TAMPILKAN KELOLA SEMUA PASIEN */
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'dashboard'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Panel Petugas</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('ibuHamil')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'ibuHamil'
                        ? 'bg-white text-rose-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Semua Ibu Hamil ({totalIbu})</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('imunisasi')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentTab === 'imunisasi'
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Baby className="w-4 h-4" />
                    <span>Semua Balita ({totalBalita})</span>
                  </button>
                </>
              ) : (
                /* JIKA BELUM LOGIN: TAMPILKAN MENU PUBLIK & LOGIN */
                <>
                  <button
                    onClick={() => setCurrentTab('landing')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      currentTab === 'landing'
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Beranda & Materi</span>
                  </button>
                </>
              )}
            </nav>

            {/* Right Side: Role Badge & Auth Buttons */}
            <div className="flex items-center gap-3">
              {session ? (
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-1.5 pr-3 rounded-2xl">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                      session.role === 'admin'
                        ? 'bg-amber-500'
                        : session.role === 'kader'
                        ? 'bg-teal-600'
                        : 'bg-indigo-600'
                    }`}
                  >
                    {session.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {session.name}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500 capitalize">
                      {isWarga ? `Orang Tua (${session.nik})` : session.role}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Keluar Akun"
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>Masuk / Pilih Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Bottom Navigation (Khusus HP, Terfilter sesuai Peran) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 shadow-lg">
        {isWarga ? (
          /* Bottom Nav untuk Warga: Hanya Buku Saya dan Materi */
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentTab('warga')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                currentTab === 'warga'
                  ? 'text-teal-700 font-bold bg-teal-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Heart className="w-5 h-5 mb-0.5 fill-rose-500 text-rose-500" />
              <span className="text-xs">Buku Kesehatan Saya</span>
            </button>

            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                currentTab === 'landing'
                  ? 'text-teal-700 font-bold bg-teal-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Materi & Panduan</span>
            </button>
          </div>
        ) : isPetugas ? (
          /* Bottom Nav untuk Kader / Admin: Panel, Ibu Hamil, Balita */
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'text-amber-700 font-bold bg-amber-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Panel</span>
            </button>

            <button
              onClick={() => setCurrentTab('ibuHamil')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
                currentTab === 'ibuHamil'
                  ? 'text-rose-600 font-bold bg-rose-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Ibu Hamil</span>
              {totalIbu > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {totalIbu}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('imunisasi')}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all relative ${
                currentTab === 'imunisasi'
                  ? 'text-teal-600 font-bold bg-teal-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Baby className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Balita</span>
              {totalBalita > 0 && (
                <span className="absolute top-1 right-3 w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {totalBalita}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* Bottom Nav untuk Pengunjung Belum Login */
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                currentTab === 'landing'
                  ? 'text-teal-700 font-bold bg-teal-50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-xs">Materi & Edukasi</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="flex flex-col items-center justify-center py-2 rounded-xl text-teal-600 hover:text-teal-800"
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-xs font-bold">Masuk Akun</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};
