import { getKategoriPrograms, getPrograms } from '@/lib/actions/program'
import { getMasterKelompok } from '@/lib/actions/kelompok'
import ClientProgramPanel from '@/app/dashboard/master-program/ClientProgramPanel'

export default async function MasterProgramPage() {
  const [kategoriList, programList, masterKelompokList] = await Promise.all([
    getKategoriPrograms(),
    getPrograms(),
    getMasterKelompok()
  ])
  
  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Master Data</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola daftar Kategori Program, Program PM, dan Kategori Kelompok</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <ClientProgramPanel 
          initialKategori={kategoriList} 
          initialPrograms={programList} 
          initialMasterKelompok={masterKelompokList}
        />
      </main>
    </div>
  )
}
