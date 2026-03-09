import React from 'react'
import { getSettingsAdminList } from '../settings/actions'
import { Settings, Cpu, Image as ImageIcon, Code, Palette, Hash, ShieldAlert } from 'lucide-react'
import EditSettingModal from '../settings/EditSettingModal'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function getSettingMeta(key: string) {
  const map: Record<string, { label: string; icon: React.ElementType; type: 'image' | 'color' | 'html' | 'text' }> = {
    'app_title': { label: 'Judul Utama Sistem (Browser Tab)', icon: Hash, type: 'text' },
    'app_company_name': { label: 'Nama Perusahaan / Organisasi', icon: Hash, type: 'text' },
    'app_logo_url': { label: 'URL Berkas Logo Header', icon: ImageIcon, type: 'image' },
    'app_favicon_url': { label: 'URL Berkas Favicon (Ikon Tab)', icon: ImageIcon, type: 'image' },
    'app_sidebar_bg_color': { label: 'Tampilan: Warna Latar Sidebar (Hex)', icon: Palette, type: 'color' },
    'app_login_bg_image': { label: 'Tampilan: Gambar Latar Halaman Login', icon: ImageIcon, type: 'image' },
    'app_login_tone_bg': { label: 'Tampilan: CSS/Hex Gradasi Halaman Login', icon: Palette, type: 'color' },
    'app_login_content': { label: 'Konten Sambutan di Halaman Login', icon: Code, type: 'html' },
    'zains_transaction_sync_enabled': { label: 'Konfigurasi: Auto-Sync Zains API (true/false)', icon: Cpu, type: 'text' },
  }
  return map[key] || { label: key, icon: Hash, type: 'text' }
}

function ValuePreview({ type, value }: { type: 'image' | 'color' | 'html' | 'text'; value: string }) {
  if (type === 'image') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-xl border border-slate-200 bg-[#f8fafc] shadow-sm flex items-center justify-center overflow-hidden shrink-0">
          <img src={value} alt="Preview" className="max-w-full max-h-full object-contain p-1" />
        </div>
        <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 break-all flex-1">
          {value}
        </div>
      </div>
    )
  }
  if (type === 'color') {
    return (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl border border-slate-200 shadow-sm shrink-0" style={{ background: value }} />
        <span className="font-mono text-xs font-semibold bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100">{value}</span>
      </div>
    )
  }
  if (type === 'html') {
    return (
      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-y-auto max-h-[120px] w-full prose prose-sm prose-slate max-w-none">
        <div dangerouslySetInnerHTML={{ __html: value }} />
      </div>
    )
  }
  return (
    <div className="text-sm font-medium text-slate-700 max-h-[100px] overflow-y-auto w-full">
      {value}
    </div>
  )
}

export default async function AppSettingsPanel() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-4 bg-white rounded-3xl shadow-sm border border-slate-100 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm">Hanya Super Admin yang dapat mengakses pengaturan ini.</p>
      </div>
    )
  }

  const settings = await getSettingsAdminList()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#7a1200]" /> Pengaturan Sistem Internal
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Ubah variabel dinamis aplikasi secara real-time tanpa deploy ulang. Hati-hati dalam menyunting konten HTML.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-medium flex items-center gap-1.5 w-fit shrink-0">
          <Cpu className="w-3.5 h-3.5" /> Mode Super Admin Aktif
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-slate-600 text-[11px] font-bold tracking-wider uppercase border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 w-[35%]">Detail Konfigurasi</th>
                <th className="px-5 py-3 w-[40%]">Pratinjau Nilai Aktif</th>
                <th className="px-5 py-3 hidden md:table-cell">Terakhir Diperbarui</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-500 bg-slate-50/50">
                    Belum ada konfigurasi sistem yang teregistrasi.
                  </td>
                </tr>
              ) : (
                settings.map((item) => {
                  const meta = getSettingMeta(item.key)
                  const Icon = meta.icon
                  return (
                    <tr key={item.key} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-[#7a1200] flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 mb-1 text-sm">{meta.label}</p>
                            <div className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded inline-block group-hover:bg-red-50 group-hover:text-[#5a0d00] transition-colors">
                              {item.key}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <ValuePreview type={meta.type} value={item.value} />
                      </td>
                      <td className="px-5 py-4 align-top hidden md:table-cell">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-slate-800">
                            {new Date(item.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                          <span className="text-slate-400">
                            {new Date(item.updated_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <EditSettingModal
                          itemKey={item.key}
                          initialValue={item.value}
                          isImage={meta.type === 'image'}
                          isColor={meta.type === 'color'}
                          labelTitle={meta.label}
                        />
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
