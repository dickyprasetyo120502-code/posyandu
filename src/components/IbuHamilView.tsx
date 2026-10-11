import React, { useState } from 'react';
import type { IbuHamil, UserSession } from '../types';
import { 
  storageService, 
  hitungHPLdanUsiaKehamilan, 
  formatTanggalIndo 
} from '../services/storage';
import { 
  Plus, 
  Search, 
  Heart, 
  Phone, 
  MapPin, 
  Trash2, 
  FileText, 
  Stethoscope, 
  X, 
  Calculator
} from 'lucide-react';

interface IbuHamilViewProps {
  session: UserSession | null;
  onOpenLogin: () => void;
  ibuHamilList: IbuHamil[];
  onRefresh: () => void;
}

export const IbuHamilView: React.FC<IbuHamilViewProps> = ({
  session,
  onOpenLogin,
  ibuHamilList,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIbuDetail, setSelectedIbuDetail] = useState<IbuHamil | null>(null);
  const [showCheckupModal, setShowCheckupModal] = useState<IbuHamil | null>(null);

  // Live Calculator Standalone Box
  const [calcHpht, setCalcHpht] = useState('');

  // Form State Tambah Ibu Hamil
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    tanggalLahir: '',
    usia: 25,
    namaSuami: '',
    noHp: '',
    alamat: '',
    hpht: '',
    gravida: 1,
    paritas: 0,
    abortus: 0,
    lila: 24,
    statusResiko: 'Rendah' as 'Rendah' | 'Tinggi' | 'Sangat Tinggi',
    catatanResiko: '',
  });

  // Form State Tambah Pemeriksaan Rutin
  const [checkupData, setCheckupData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    beratBadanKg: 55,
    tekananDarah: '120/80',
    tinggiFundusCm: 20,
    djj: 140,
    keluhan: '',
    tindakan: 'Pemberian Tablet Tambah Darah (Fe) dan Vitamin',
    kaderPencatat: session?.name || 'Kader Posyandu',
  });

  const liveCalcResult = calcHpht ? hitungHPLdanUsiaKehamilan(calcHpht) : null;

  // Filtered List
  const filteredList = ibuHamilList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.nama.toLowerCase().includes(q) ||
      item.nik.includes(q) ||
      item.namaSuami.toLowerCase().includes(q)
    );
  });

  const handleHphtChange = (hphtVal: string) => {
    setFormData((prev) => ({
      ...prev,
      hpht: hphtVal,
      statusResiko: prev.lila < 23.5 ? 'Tinggi' : prev.statusResiko,
    }));
  };

  const handleLilaChange = (lilaVal: number) => {
    setFormData((prev) => ({
      ...prev,
      lila: lilaVal,
      statusResiko: lilaVal < 23.5 ? 'Tinggi' : prev.statusResiko,
      catatanResiko: lilaVal < 23.5 ? 'Indikasi KEK (Kurang Energi Kronis) LiLA < 23.5 cm' : '',
    }));
  };

  const handleSaveIbu = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nik.trim() ||
      !formData.nama.trim() ||
      !formData.namaSuami.trim() ||
      !formData.noHp.trim() ||
      !formData.alamat.trim() ||
      !formData.hpht.trim() ||
      !formData.usia ||
      !formData.lila
    ) {
      alert('Semua kolom data Ibu Hamil wajib diisi lengkap (NIK, Nama Ibu, Usia, Suami, No HP, Alamat, HPHT, dan LiLA)! Tidak dapat disimpan jika ada yang kosong.');
      return;
    }

    const calc = hitungHPLdanUsiaKehamilan(formData.hpht);
    if (!calc) {
      alert('Format HPHT tidak valid.');
      return;
    }

    try {
      storageService.saveIbuHamil({
        ...formData,
        hpl: calc.hplDateISO,
      });

      onRefresh();
      setShowAddModal(false);
      // Reset form
      setFormData({
        nik: '',
        nama: '',
        tanggalLahir: '',
        usia: 25,
        namaSuami: '',
        noHp: '',
        alamat: '',
        hpht: '',
        gravida: 1,
        paritas: 0,
        abortus: 0,
        lila: 24,
        statusResiko: 'Rendah',
        catatanResiko: '',
      });
      alert('Data Ibu Hamil berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data ibu hamil.');
    }
  };

  const handleDeleteIbu = (id: string, nama: string) => {
    if (confirm(`Hapus data ibu hamil "${nama}"?`)) {
      storageService.deleteIbuHamil(id);
      onRefresh();
      if (selectedIbuDetail?.id === id) setSelectedIbuDetail(null);
    }
  };

  const handleSaveCheckup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckupModal) return;

    const pregInfo = hitungHPLdanUsiaKehamilan(showCheckupModal.hpht);
    const usiaMinggu = pregInfo?.gestationalWeeks || 0;

    storageService.addPemeriksaanIbuHamil(showCheckupModal.id, {
      tanggal: checkupData.tanggal,
      usiaKehamilanMinggu: usiaMinggu,
      beratBadanKg: Number(checkupData.beratBadanKg),
      tekananDarah: checkupData.tekananDarah,
      tinggiFundusCm: Number(checkupData.tinggiFundusCm),
      djj: Number(checkupData.djj),
      keluhan: checkupData.keluhan || 'Tidak ada keluhan khusus',
      tindakan: checkupData.tindakan,
      kaderPencatat: session?.name || 'Kader Posyandu',
    });

    onRefresh();
    setShowCheckupModal(null);
    alert('Pemeriksaan berhasil dicatat!');
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Banner & Quick Calculator Widget */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3 backdrop-blur-md">
            <Heart className="w-3.5 h-3.5 fill-white" />
            <span>Kesehatan Ibu & Janin</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Pemantauan Ibu Hamil & Kalkulator HPL
          </h1>
          <p className="text-sm sm:text-base text-rose-100 mt-2">
            Hitung perkiraan tanggal melahirkan (HPL) otomatis menggunakan rumus medis Naegele, pantau usia kandungan, serta deteksi dini faktor risiko kehamilan.
          </p>
        </div>

        {/* Quick Calculator Card on Top */}
        <div className="mt-6 bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 sm:p-5 text-white max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-rose-200" />
            <h3 className="font-bold text-sm sm:text-base">Kalkulator Cepat Hari Perkiraan Lahir (HPL)</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <label className="block text-xs text-rose-100 font-medium mb-1">
                Masukkan HPHT (Hari Pertama Haid Terakhir):
              </label>
              <input
                type="date"
                value={calcHpht}
                onChange={(e) => setCalcHpht(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/80"
              />
            </div>
            {liveCalcResult && (
              <div className="bg-white/20 rounded-xl p-3 border border-white/30 flex-1">
                <span className="text-[11px] uppercase tracking-wider text-rose-100 block font-bold">
                  Perkiraan Lahir:
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {liveCalcResult.hplDateFormatted}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-rose-100">
                  <span className="font-semibold bg-white/25 px-2 py-0.5 rounded-full">
                    {liveCalcResult.gestationalWeeks} mg {liveCalcResult.gestationalDays} hr
                  </span>
                  <span>• {liveCalcResult.daysRemaining} hari lagi</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIK atau Nama Ibu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!session) {
                onOpenLogin();
              } else {
                setShowAddModal(true);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data Ibu Hamil</span>
          </button>
        </div>
      </div>

      {/* Cards List or Empty State */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchQuery ? 'Data Tidak Ditemukan' : 'Belum Ada Data Pasien Ibu Hamil'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada pasien yang cocok dengan kata kunci "${searchQuery}".`
              : 'Sistem dimulai dari 0 tanpa data contoh. Klik tombol di bawah untuk mendaftarkan pasien ibu hamil pertama.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                if (!session) onOpenLogin();
                else setShowAddModal(true);
              }}
              className="mt-5 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Pasien Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((ibu) => {
            const pregInfo = hitungHPLdanUsiaKehamilan(ibu.hpht);

            return (
              <div
                key={ibu.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        ibu.statusResiko === 'Sangat Tinggi'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : ibu.statusResiko === 'Tinggi'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Risiko {ibu.statusResiko}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      NIK: {ibu.nik}
                    </span>
                  </div>

                  {/* Header Info */}
                  <h3 className="text-lg font-bold text-slate-800 leading-snug">
                    {ibu.nama}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Usia: {ibu.usia} thn • Suami: {ibu.namaSuami || '-'}
                  </p>

                  {/* Pregnancy Timeline Highlight */}
                  {pregInfo && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-rose-800">
                          {pregInfo.gestationalWeeks} Minggu {pregInfo.gestationalDays} Hari
                        </span>
                        <span className="font-extrabold text-rose-600 text-xs">
                          {pregInfo.daysRemaining > 0
                            ? `${pregInfo.daysRemaining} hari lagi`
                            : 'Waktu Bersalin Tiba!'}
                        </span>
                      </div>

                      {/* Progress Bar ke 40 Minggu */}
                      <div className="w-full bg-rose-200/60 rounded-full h-2 mb-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pregInfo.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>HPL: {pregInfo.hplDateFormatted}</span>
                        <span className="font-bold text-slate-700">T{pregInfo.trimester}</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Metadata */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ibu.alamat || 'Alamat belum diisi'}</span>
                    </div>
                    {ibu.noHp && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a
                          href={`https://wa.me/${ibu.noHp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          {ibu.noHp}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>G{ibu.gravida} P{ibu.paritas} A{ibu.abortus}</span>
                      <span>• LiLA: {ibu.lila} cm</span>
                      <span>• {ibu.riwayatPemeriksaan?.length || 0}x Periksa</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowCheckupModal(ibu)}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>+ Periksa</span>
                    </button>
                    <button
                      onClick={() => setSelectedIbuDetail(ibu)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Riwayat</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteIbu(ibu.id, ibu.nama)}
                    title="Hapus Data"
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

      {/* MODAL 1: Tambah Data Ibu Hamil */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl my-8 overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Heart className="w-5 h-5 fill-white" />
                <h3 className="font-bold text-lg">Pendaftaran Ibu Hamil Baru</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIbu} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK Ibu (16 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="3201..."
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Ibu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Ibu"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usia (Tahun)
                  </label>
                  <input
                    type="number"
                    value={formData.usia}
                    onChange={(e) => setFormData({ ...formData, usia: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Suami
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Suami"
                    value={formData.namaSuami}
                    onChange={(e) => setFormData({ ...formData, namaSuami: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.noHp}
                    onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HPHT (Hari Pertama Haid Terakhir) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hpht}
                    onChange={(e) => handleHphtChange(e.target.value)}
                    className="w-full px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Live Preview HPL saat mengisi form */}
              {formData.hpht && (
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs">
                  {(() => {
                    const calc = hitungHPLdanUsiaKehamilan(formData.hpht);
                    if (!calc) return null;
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between font-bold text-rose-900">
                          <span>Estimasi HPL: {calc.hplDateFormatted}</span>
                          <span>{calc.daysRemaining} Hari Lagi</span>
                        </div>
                        <p className="text-rose-700">
                          Usia Kehamilan: <strong>{calc.gestationalWeeks} Minggu {calc.gestationalDays} Hari</strong> ({calc.statusDesc})
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gravida (Hamil Ke-)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.gravida}
                    onChange={(e) => setFormData({ ...formData, gravida: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Paritas (Pernah Lahir)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.paritas}
                    onChange={(e) => setFormData({ ...formData, paritas: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Abortus (Keguguran)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.abortus}
                    onChange={(e) => setFormData({ ...formData, abortus: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    LiLA (Lingkar Lengan Atas dlm cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.lila}
                    onChange={(e) => handleLilaChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Batas normal ≥ 23.5 cm (Kurang = Risiko KEK)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Risiko Kehamilan
                  </label>
                  <select
                    value={formData.statusResiko}
                    onChange={(e) => setFormData({ ...formData, statusResiko: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white font-semibold"
                  >
                    <option value="Rendah">Risiko Rendah (Normal)</option>
                    <option value="Tinggi">Risiko Tinggi (Perlu Pantau)</option>
                    <option value="Sangat Tinggi">Risiko Sangat Tinggi (Rujukan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Rumah
                </label>
                <textarea
                  rows={2}
                  placeholder="RT/RW, Dusun, Desa"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20"
                >
                  Simpan Pasien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Catat Pemeriksaan Rutin Kehamilan */}
      {showCheckupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Catat Pemeriksaan Kehamilan</h3>
                <p className="text-xs text-teal-100 font-medium">
                  Pasien: {showCheckupModal.nama} ({showCheckupModal.nik})
                </p>
              </div>
              <button
                onClick={() => setShowCheckupModal(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheckup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pemeriksaan
                  </label>
                  <input
                    type="date"
                    required
                    value={checkupData.tanggal}
                    onChange={(e) => setCheckupData({ ...checkupData, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tekanan Darah (mmHg)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    value={checkupData.tekananDarah}
                    onChange={(e) => setCheckupData({ ...checkupData, tekananDarah: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={checkupData.beratBadanKg}
                    onChange={(e) => setCheckupData({ ...checkupData, beratBadanKg: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tinggi Fundus (cm)
                  </label>
                  <input
                    type="number"
                    value={checkupData.tinggiFundusCm}
                    onChange={(e) => setCheckupData({ ...checkupData, tinggiFundusCm: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detak Jantung Janin (DJJ - bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="120-160"
                    value={checkupData.djj}
                    onChange={(e) => setCheckupData({ ...checkupData, djj: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kader / Petugas
                  </label>
                  <input
                    type="text"
                    value={checkupData.kaderPencatat}
                    onChange={(e) => setCheckupData({ ...checkupData, kaderPencatat: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keluhan Ibu
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Mual pagi hari, pusing ringan..."
                  value={checkupData.keluhan}
                  onChange={(e) => setCheckupData({ ...checkupData, keluhan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tindakan & Vitamin Diberikan
                </label>
                <input
                  type="text"
                  value={checkupData.tindakan}
                  onChange={(e) => setCheckupData({ ...checkupData, tindakan: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckupModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Detail Riwayat Pemeriksaan */}
      {selectedIbuDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Buku KIA Digital - {selectedIbuDetail.nama}</h3>
                <p className="text-xs text-rose-100">
                  NIK: {selectedIbuDetail.nik} • HPL: {formatTanggalIndo(selectedIbuDetail.hpl)}
                </p>
              </div>
              <button
                onClick={() => setSelectedIbuDetail(null)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Gravida/Paritas</span>
                  <span className="font-bold text-slate-800">
                    G{selectedIbuDetail.gravida} P{selectedIbuDetail.paritas} A{selectedIbuDetail.abortus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">LiLA</span>
                  <span className="font-bold text-slate-800">{selectedIbuDetail.lila} cm</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status Risiko</span>
                  <span className="font-bold text-rose-600">{selectedIbuDetail.statusResiko}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">No. Telepon</span>
                  <span className="font-bold text-slate-800">{selectedIbuDetail.noHp || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>Riwayat Pemeriksaan Kehamilan ({selectedIbuDetail.riwayatPemeriksaan?.length || 0})</span>
                </h4>

                {(!selectedIbuDetail.riwayatPemeriksaan || selectedIbuDetail.riwayatPemeriksaan.length === 0) ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500">Belum ada catatan pemeriksaan rutin.</p>
                    <button
                      onClick={() => {
                        setShowCheckupModal(selectedIbuDetail);
                        setSelectedIbuDetail(null);
                      }}
                      className="mt-3 px-4 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
                    >
                      + Tambah Pemeriksaan Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedIbuDetail.riwayatPemeriksaan.map((pem, idx) => (
                      <div
                        key={pem.id || idx}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                            Tgl: {formatTanggalIndo(pem.tanggal)} ({pem.usiaKehamilanMinggu} Minggu)
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Petugas: {pem.kaderPencatat}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 border-y border-slate-100 my-2">
                          <div>
                            <span className="text-slate-400 block">TD</span>
                            <span className="font-bold">{pem.tekananDarah}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">BB</span>
                            <span className="font-bold">{pem.beratBadanKg} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Tinggi Fundus</span>
                            <span className="font-bold">{pem.tinggiFundusCm ? `${pem.tinggiFundusCm} cm` : '-'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">DJJ</span>
                            <span className="font-bold">{pem.djj ? `${pem.djj} bpm` : '-'}</span>
                          </div>
                        </div>
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><strong>Keluhan:</strong> {pem.keluhan}</p>
                          <p><strong>Tindakan/Obat:</strong> {pem.tindakan}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedIbuDetail(null)}
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
