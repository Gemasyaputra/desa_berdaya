import AppSettingsPanel from './app-settings-panel'

export default async function KonfigurasiPage() {
  return (
    <div>
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Konfigurasi</h1>
          <p className="text-slate-500 text-sm">Pengaturan sistem aplikasi</p>
        </div>
      </header>
      <div className="p-6">
        <AppSettingsPanel />
      </div>
    </div>
  )
}
