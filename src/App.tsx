import { useState, useEffect } from 'react';
import type { UserSession, IbuHamil, Balita, ImunisasiRecord, PertumbuhanRecord } from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingLoginView } from './components/LandingLoginView';
import { DashboardView } from './components/DashboardView';
import { IbuHamilView } from './components/IbuHamilView';
import { ImunisasiView } from './components/ImunisasiView';
import { WargaPortal } from './components/WargaPortal';
import { HeartHandshake } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'dashboard' | 'ibuHamil' | 'imunisasi' | 'warga'>('landing');
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Data State dari LocalStorage (Inisial dari 0)
  const [ibuHamilList, setIbuHamilList] = useState<IbuHamil[]>([]);
  const [balitaList, setBalitaList] = useState<Balita[]>([]);
  const [imunisasiList, setImunisasiList] = useState<ImunisasiRecord[]>([]);
  const [pertumbuhanList, setPertumbuhanList] = useState<PertumbuhanRecord[]>([]);
  const [dbConnected, setDbConnected] = useState(false);

  // Muat data saat pertama dibuka & sinkronkan dari database
  const refreshAllData = async () => {
    // Cek koneksi backend SQLite
    const health = await storageService.checkDatabaseHealth();
    setDbConnected(health.connected);

    // Sinkronkan data jika server aktif
    if (health.connected) {
      await storageService.syncFromDatabase();
    }

    setIbuHamilList(storageService.getIbuHamil());
    setBalitaList(storageService.getBalita());
    setImunisasiList(storageService.getImunisasi());
    setPertumbuhanList(storageService.getPertumbuhan());
  };

  useEffect(() => {
    // Ambil data pasien (disinkronkan dengan database SQLite)
    refreshAllData();

    // Ambil session jika ada
    const savedSession = storageService.getSession();
    if (savedSession) {
      setSession(savedSession);
      // Jika sudah login warga, arahkan ke warga, jika petugas ke dashboard
      if (savedSession.role === 'warga') {
        setCurrentTab('warga');
      } else {
        setCurrentTab('dashboard');
      }
    }
  }, []);

  // Perlindungan Privasi: Warga tidak boleh mengakses data rekapitulasi semua warga
  useEffect(() => {
    if (session?.role === 'warga' && (currentTab === 'ibuHamil' || currentTab === 'imunisasi' || currentTab === 'dashboard')) {
      setCurrentTab('warga');
    }
  }, [session, currentTab]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    storageService.setSession(newSession);
    setIsLoginModalOpen(false);

    // Navigasi setelah login berhasil
    if (newSession.role === 'warga') {
      setCurrentTab('warga');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    storageService.clearSession();
    setSession(null);
    setCurrentTab('landing');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        session={session}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        totalIbu={ibuHamilList.length}
        totalBalita={balitaList.length}
        dbConnected={dbConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'landing' && (
          <LandingLoginView
            onLoginSuccess={handleLoginSuccess}
            onExploreAsGuest={() => setCurrentTab('ibuHamil')}
            ibuHamilList={ibuHamilList}
            balitaList={balitaList}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            session={session}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            ibuHamilList={ibuHamilList}
            balitaList={balitaList}
            imunisasiList={imunisasiList}
            pertumbuhanList={pertumbuhanList}
            onRefresh={refreshAllData}
          />
        )}

        {currentTab === 'ibuHamil' && (
          <IbuHamilView
            session={session}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            ibuHamilList={ibuHamilList}
            onRefresh={refreshAllData}
          />
        )}

        {currentTab === 'imunisasi' && (
          <ImunisasiView
            session={session}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            balitaList={balitaList}
            imunisasiList={imunisasiList}
            pertumbuhanList={pertumbuhanList}
            onRefresh={refreshAllData}
          />
        )}

        {currentTab === 'warga' && (
          <WargaPortal
            session={session}
            ibuHamilList={ibuHamilList}
            balitaList={balitaList}
            imunisasiList={imunisasiList}
            pertumbuhanList={pertumbuhanList}
            onLoginRequest={() => setIsLoginModalOpen(true)}
            onRefresh={refreshAllData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-700">Posyandu Digital Terpadu</span>
            <span>• Mandiri & Responsif </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Sistem Layanan Posyandu</span>
            <span>•</span>
            <span>Desa Kedung Jaya</span>
          </div>
        </div>
      </footer>

      {/* Login & Role Selection Modal (Jika dibuka dari tombol Navbar) */}
      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
