import React, { useState } from 'react';
import type { UserRole, UserSession } from '../types';
import { storageService } from '../services/storage';
import { supabaseService } from '../services/supabaseClient';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Heart, 
  Lock, 
  CreditCard, 
  LogIn, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'warga' | 'petugas'>('warga');
  
  // Warga Form
  const [nikInput, setNikInput] = useState('');

  // Petugas Form
  const [petugasRole, setPetugasRole] = useState<'kader' | 'admin'>('kader');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleWargaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanNik = nikInput.trim();
    if (!cleanNik) {
      setErrorMsg('Mohon masukkan Nomor Induk Kependudukan (NIK).');
      return;
    }
    if (cleanNik.length < 6) {
      setErrorMsg('NIK harus terdiri dari minimal 6 hingga 16 digit.');
      return;
    }

    // Validasi real-time ke Database SQLite & fallback cache
    const registeredCheck = await storageService.verifyNikWithApi(cleanNik);
    if (!registeredCheck.registered) {
      setErrorMsg(
        `NIK ${cleanNik} belum terdaftar di sistem Posyandu! Pendaftaran NIK hanya dapat dilakukan oleh Admin atau Kader Posyandu.`
      );
      return;
    }

    const session: UserSession = {
      role: 'warga',
      name: registeredCheck.name,
      nik: cleanNik,
    };

    onLoginSuccess(session);
    onClose();
  };

  const handlePetugasLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Coba autentikasi ke database cloud Supabase
    try {
      const cloudSession = await supabaseService.loginPetugas(username, password, petugasRole);
      if (cloudSession) {
        onLoginSuccess(cloudSession);
        onClose();
        return;
      }
    } catch {
      // Abaikan jika offline, lanjut ke fallback
    }

    // Fallback autentikasi lokal
    if (petugasRole === 'admin') {
      if (username.toLowerCase() === 'admin' && password === 'admin123') {
        onLoginSuccess({
          role: 'admin',
          name: 'Administrator Posyandu',
          username: 'admin',
        });
        onClose();
      } else {
        setErrorMsg('Username atau password Admin salah! Coba periksa kembali.');
      }
    } else {
      if (username.toLowerCase() === 'kader' && password === 'kader123') {
        onLoginSuccess({
          role: 'kader',
          name: 'Kader Posyandu Desa',
          username: 'kader',
        });
        onClose();
      } else {
        setErrorMsg('Username atau password Kader salah! Coba periksa kembali.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-teal-700 to-emerald-600 px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Masuk ke Posyandu</h3>
              <p className="text-xs text-teal-100 font-medium">
                Pilih peran Anda untuk akses layanan
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-1.5 bg-black/15 p-1 rounded-2xl mt-5">
            <button
              onClick={() => {
                setActiveTab('warga');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'warga'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>Orang Tua (NIK)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('petugas');
                setErrorMsg('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'petugas'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin / Kader</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 font-medium leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'warga' ? (
            /* Warga Form (Berdasarkan NIK Terdaftar) */
            <form onSubmit={handleWargaLogin} className="space-y-4">
              <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-3 text-xs text-teal-900 leading-relaxed">
                <span className="font-semibold block text-teal-800 mb-0.5">Khusus NIK Terdaftar</span>
                Hanya NIK yang sudah didaftarkan oleh Kader atau Admin Posyandu yang dapat masuk ke halaman orang tua.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Induk Kependudukan (NIK Terdaftar) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={nikInput}
                    onChange={(e) => setNikInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan 16 digit NIK..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {nikInput.length}/16 Digit NIK KTP
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Masuk dengan NIK</span>
              </button>
            </form>
          ) : (
            /* Petugas (Admin & Kader) Form */
            <form onSubmit={handlePetugasLogin} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPetugasRole('kader');
                    setUsername('');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    petugasRole === 'kader'
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Akun Kader
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPetugasRole('admin');
                    setUsername('');
                    setPassword('');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    petugasRole === 'admin'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Akun Admin
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={petugasRole === 'admin' ? 'Masukkan username admin' : 'Masukkan username kader'}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Masuk sebagai {petugasRole === 'admin' ? 'Admin' : 'Kader'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
