import AppSettingsPanel from './app-settings-panel'
import Link from 'next/link'
import { ImageIcon } from 'lucide-react'

export default async function KonfigurasiPage() {
  return (
    <div>
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Konfigurasi</h1>
          <p className="text-slate-500 text-sm">Pengaturan sistem aplikasi</p>
        </div>
      </header>
      <div className="p-6 space-y-6">
        <AppSettingsPanel />

        {/* Shortcut: Docs Asset Uploader */}
        <Link
          href="/dashboard/konfigurasi/docs-asset"
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-[#7a1200] hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">Upload Screenshot Dokumentasi Zudoku</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload gambar per role untuk mengganti placeholder di halaman <strong>Flow & Roles</strong> dokumentasi API.
            </p>
          </div>
          <span className="ml-auto text-xs text-slate-400 group-hover:text-[#7a1200] font-medium transition-colors">Buka →</span>
        </Link>
      </div>
    </div>
  )
}
