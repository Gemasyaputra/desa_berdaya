import React from 'react'
import { getSettingsAdminList } from './actions'
import { Settings, ShieldAlert, Cpu, Image as ImageIcon, Code, Palette, Hash } from 'lucide-react'
import EditSettingModal from './EditSettingModal'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function getSettingMeta(key: string) {
  const map: Record<string, { label: string, icon: React.ElementType, type: 'image' | 'color' | 'html' | 'text' }> = {
    'app_title': { label: 'Judul Utama Sistem (Browser Tab)', icon: Hash, type: 'text' },
    'app_company_name': { label: 'Nama Perusahaan / Organisasi', icon: Hash, type: 'text' },
    'app_logo_url': { label: 'URL Berkas Logo Header', icon: ImageIcon, type: 'image' },
    'app_favicon_url': { label: 'URL Berkas Favicon (Ikon Tab)', icon: ImageIcon, type: 'image' },
    'app_sidebar_bg_color': { label: 'Tampilan: Warna Latar Sidebar (Hex)', icon: Palette, type: 'color' },
    'app_login_bg_image': { label: 'Tampilan: Gambar Latar Halaman Login', icon: ImageIcon, type: 'image' },
    'app_login_tone_bg': { label: 'Tampilan: CSS/Hex Gradasi Halaman Login', icon: Palette, type: 'color' },
    'app_login_content': { label: 'Konten Sambutan di Halaman Login', icon: Code, type: 'html' },
    'zains_transaction_sync_enabled': { label: 'Konfigurasi: Auto-Sync Zains API (true/false)', icon: Cpu, type: 'text' }
  }
  return map[key] || { label: key, icon: Hash, type: 'text' }
}

function ValuePreview({ type, value }: { type: 'image' | 'color' | 'html' | 'text', value: string }) {
  if (type === 'image') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-20 h-20 rounded-xl border border-slate-200 bg-[#f8fafc] shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative custom-checkerboard">
          <img src={value} alt="Preview" className="max-w-full max-h-full object-contain p-2" />
        </div>
        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 break-all overflow-hidden flex-1">
          {value}
        </div>
      </div>
    )
  }
  
  if (type === 'color') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm shrink-0" style={{ background: value }}></div>
        <span className="font-mono text-xs font-semibold bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">{value}</span>
      </div>
    )
  }
  
  if (type === 'html') {
    return (
       <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-y-auto max-h-[150px] w-full prose prose-sm prose-slate max-w-none">
         <div dangerouslySetInnerHTML={{ __html: value }} />
       </div>
    )
  }

  // Teks Biasa
  return (
    <div className="text-sm font-medium text-slate-700 max-h-[120px] overflow-y-auto w-full">
      {value}
    </div>
  )
}

export default async function AppSettingsPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-white rounded-3xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500">Anda tidak memiliki kredensial Super Admin yang diperlukan untuk membuka pengaturan teknis (App Settings) ini.</p>
      </div>
    )
  }

  const settings = await getSettingsAdminList()

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#7a1200]" /> Pengaturan Sistem Internal
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Area administrasi tertinggi untuk mengubah nilai variabel dinamis `app_settings` aplikasi secara *real-time* tanpa mengubah kode sumber peladen. Hati-hati dalam menyunting struktur HTML.
          </p>
        </div>
        
        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-sm font-medium flex items-center gap-2">
           <Cpu className="w-4 h-4" /> Mode Super Admin Aktif
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-slate-600 text-[11px] font-bold tracking-wider uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 w-[35%]">Detail Konfigurasi</th>
                <th className="px-6 py-4 w-[40%]">Pratinjau Nilai Aktif</th>
                <th className="px-6 py-4 hidden md:table-cell">Terakhir Diperbarui</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    Belum ada konfigurasi sistem yang teregistrasi.
                  </td>
                </tr>
              ) : (
                settings.map((item) => {
                  const meta = getSettingMeta(item.key)
                  const Icon = meta.icon

                  return (
                  <tr key={item.key} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-[#7a1200] flex items-center justify-center shrink-0 border border-teal-100/50">
                           <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 mb-1">{meta.label}</p>
                          <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block group-hover:bg-red-50 group-hover:text-[#5a0d00] transition-colors">
                            {item.key}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <ValuePreview type={meta.type} value={item.value} />
                    </td>
                    <td className="px-6 py-5 align-top hidden md:table-cell">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium text-slate-800">
                          {new Date(item.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <span className="text-slate-400">
                          {new Date(item.updated_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top text-center">
                      <EditSettingModal itemKey={item.key} initialValue={item.value} isImage={meta.type === 'image'} isColor={meta.type === 'color'} labelTitle={meta.label} />
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
