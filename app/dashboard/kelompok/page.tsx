import { getDesaBerdayaOptions } from '@/app/dashboard/pm/actions'
import { getPrograms } from '@/lib/actions/program'
import { getAllKelompok } from '@/lib/actions/kelompok'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ClientKelompokMainPanel from '@/app/dashboard/kelompok/ClientKelompokMainPanel'
import { headers } from 'next/headers'

export default async function KelompokPage() {
  const session = await getServerSession(authOptions)
  const headersList = await headers()
  const url = headersList.get('x-url') || ''
  const searchParams = url.includes('?') ? new URL(url).searchParams : null
  const defaultDesaIdParam = searchParams?.get('desaId')
  const defaultDesaId = defaultDesaIdParam ? Number(defaultDesaIdParam) : undefined
  
  let relawanId: number | undefined = undefined
  if (
    session?.user?.role !== 'ADMIN' && 
    session?.user?.role !== 'MONEV' && 
    session?.user?.role !== 'FINANCE'
  ) {
    relawanId = session?.user?.operator_id ? Number(session.user.operator_id) : undefined
  }

  const [kelompokList, programList, desaList] = await Promise.all([
    getAllKelompok(relawanId),
    getPrograms(),
    getDesaBerdayaOptions()
  ])
  
  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Kelompok</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola pengelompokan Penerima Manfaat per Desa Binaan</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <ClientKelompokMainPanel 
          initialKelompok={kelompokList} 
          initialPrograms={programList} 
          desaOptions={desaList}
          defaultDesaId={defaultDesaId}
        />
      </main>
    </div>
  )
}
