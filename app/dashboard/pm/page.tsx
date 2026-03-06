import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, UserSquare2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function PenerimaManfaatPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  const operatorId = session?.user?.operator_id

  let penerimaList = []

  try {
    if (role === 'RELAWAN' || role === 'PROG_HEAD') {
      penerimaList = (await sql`
        SELECT pm.*, dc.nama_desa
        FROM penerima_manfaat pm
        JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.relawan_id = ${operatorId}
        ORDER BY pm.id DESC
      `) as any[]
    } else {
      penerimaList = (await sql`
        SELECT pm.*, dc.nama_desa
        FROM penerima_manfaat pm
        JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        ORDER BY pm.id DESC
      `) as any[]
    }
  } catch (error) {
    console.error('Failed to fetch PM:', error)
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Penerima Manfaat</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data penerima manfaat per desa binaan Anda.</p>
        </div>
        
        {(role === 'RELAWAN' || role === 'PROG_HEAD') && (
          <Link href="/dashboard/pm/tambah" className="shrink-0">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Tambah PM (Scan KTP)
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari NIK atau Nama..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Penerima Manfaat</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Desa Binaan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {penerimaList.map((pm: any) => (
                <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                        <UserSquare2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{pm.nama}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{pm.nik}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {pm.kategori_pm}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {pm.nama_desa}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
                      Detail
                    </Button>
                  </td>
                </tr>
              ))}
              {penerimaList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data penerima manfaat yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
