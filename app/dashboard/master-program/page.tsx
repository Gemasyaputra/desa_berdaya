import { getKategoriPrograms, getPrograms } from '@/lib/actions/program'
import { getFormCategories } from '@/lib/actions/form-builder'
import ClientProgramPanel from '@/app/dashboard/master-program/ClientProgramPanel'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function MasterProgramPage() {
  const session = await getServerSession(authOptions)
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [kategoriList, programList, formCategories] = await Promise.all([
    getKategoriPrograms(),
    getPrograms(),
    getFormCategories()
  ])
  
  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Master Data</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola daftar Kategori Program dan Program PM</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <ClientProgramPanel 
          initialKategori={kategoriList} 
          initialPrograms={programList} 
          formCategories={formCategories}
        />
      </main>
    </div>
  )
}
