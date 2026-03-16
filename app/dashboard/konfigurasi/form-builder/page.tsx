import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getFormCategories } from '@/lib/actions/form-builder'
import { getKategoriPrograms, getPrograms } from '@/lib/actions/program'
import { FormBuilderClient } from './form-builder-client'

export default async function FormBuilderPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login')
  }

  if ((session.user as any).role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const [categories, kategoriPrograms, programs] = await Promise.all([
    getFormCategories(),
    getKategoriPrograms(),
    getPrograms(),
  ])

  return (
    <div>
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Builder</h1>
          <p className="text-slate-500 text-sm">
            Konfigurasi kategori form dan custom field per Kategori Program dan Program PM
          </p>
        </div>
      </header>
      <div className="p-6">
        <FormBuilderClient
          initialCategories={categories}
          kategoriOptions={kategoriPrograms}
          programOptions={programs}
        />
      </div>
    </div>
  )
}
