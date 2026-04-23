'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, ArrowLeft, Building2, Plus, X, Trash2, UsersRound, Building } from 'lucide-react'
import { toast } from 'sonner'
import {
  getOffices,
  getDesaByOffice,
  getUnassignedDesa,
  assignDesaToOffice,
  unassignDesaFromOffice,
  type OfficeWithStats
} from '@/lib/actions/office'

export default function WilayahOfficePage() {
  const params = useParams()
  const idStr = (params?.id as string) || ''
  const officeId = useMemo(() => {
    const n = Number(idStr)
    return Number.isFinite(n) ? n : 0
  }, [idStr])

  const [loading, setLoading] = useState(true)
  const [officeDetail, setOfficeDetail] = useState<OfficeWithStats | null>(null)
  
  const [assignedDesa, setAssignedDesa] = useState<any[]>([])
  const [unassignedDesa, setUnassignedDesa] = useState<any[]>([])
  
  // States for Assign Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedToAssign, setSelectedToAssign] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = async () => {
    if (!officeId) return
    setLoading(true)
    try {
      const allOffices = await getOffices()
      const current = allOffices.find(o => o.id === officeId) || null
      setOfficeDetail(current)

      const assigned = await getDesaByOffice(officeId)
      setAssignedDesa(assigned)

      const unassigned = await getUnassignedDesa()
      setUnassignedDesa(unassigned)
    } catch (e) {
      toast.error('Gagal mengambil data wilayah Office')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [officeId])

  const handleToggleAssign = (desaId: number) => {
    setSelectedToAssign(prev => 
      prev.includes(desaId) ? prev.filter(id => id !== desaId) : [...prev, desaId]
    )
  }

  const handleAssignSubmit = async () => {
    if (selectedToAssign.length === 0) return
    setIsSubmitting(true)
    const result = await assignDesaToOffice(officeId, selectedToAssign)
    if (result.success) {
      toast.success(`${selectedToAssign.length} desa berhasil ditugaskan ke Office ini.`)
      setIsAssignOpen(false)
      setSelectedToAssign([])
      load()
    } else {
      toast.error(result.error || 'Gagal menugaskan desa.')
    }
    setIsSubmitting(false)
  }

  const handleUnassign = async (desaId: number, namaDesa: string) => {
    if (!confirm(`Hapus desa ${namaDesa} dari pengawasan Office ini?`)) return
    const result = await unassignDesaFromOffice(desaId)
    if (result.success) {
      toast.success('Desa berhasil dihapus dari pengawasan.')
      load()
    } else {
      toast.error(result.error || 'Gagal menghapus desa.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
           <div className="flex items-center gap-3">
             <Link href="/dashboard/office">
               <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                 <ArrowLeft className="w-5 h-5 text-slate-600" />
               </Button>
             </Link>
             <div>
               <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Building2 className="w-5 h-5 text-indigo-600" />
                 Wilayah — Kantor Regional
               </h1>
               <p className="text-slate-500 text-xs mt-0.5">Daftar desa di bawah pengawasan kantor ini</p>
             </div>
           </div>
           
           {officeDetail && (
             <div className="flex items-center gap-2 flex-wrap">
               <Badge className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 shadow-sm"><Building className="w-3.5 h-3.5 mr-1.5"/> {officeDetail.nama_office}</Badge>
               <Badge className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 shadow-sm"><MapPin className="w-3.5 h-3.5 mr-1.5"/> {assignedDesa.length} Desa</Badge>
             </div>
           )}
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Header Action Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
               <div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Desa Binaan Regional</h2>
                  <p className="text-sm text-slate-500 mt-1 max-w-xl">
                    Desa yang ditugaskan ke sini akan secara otomatis bisa dipantau datanya oleh seluruh <strong>Office User</strong> (Karyawan Kantor) yang terhubung ke regional ini.
                  </p>
               </div>
               <Button onClick={() => setIsAssignOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> Assign Desa Baru
               </Button>
            </div>

            {/* List Desa */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
               {assignedDesa.length === 0 ? (
                 <div className="p-16 text-center bg-slate-50/50 m-6 rounded-3xl border border-dashed border-slate-300">
                   <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                   <p className="text-slate-500 font-bold text-lg">Belum ada Desa Binaan</p>
                   <p className="text-sm text-slate-400 mt-1">Gunakan tombol Assign Desa Baru untuk mulai menugaskan wilayah.</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto p-4">
                   <table className="w-full">
                     <thead className="border-b border-slate-100 bg-slate-50/80">
                       <tr>
                         <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                         <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Identitas Desa Teritorial</th>
                         <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Hirarki Lapangan (Korwil & Relawan)</th>
                         <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                       </tr>
                     </thead>
                     <tbody>
                       {assignedDesa.map((desa, i) => (
                         <tr key={desa.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                           <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                           <td className="py-4 px-4">
                             <div className="flex items-start gap-3">
                               <div className="mt-0.5"><MapPin className="w-5 h-5 text-indigo-600" /></div>
                               <div>
                                 <p className="text-sm font-black text-slate-800">{desa.nama_desa}</p>
                                 <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[200px]">
                                   {desa.nama_kecamatan}, {desa.nama_kota}, {desa.nama_provinsi}
                                 </p>
                               </div>
                             </div>
                           </td>
                           <td className="py-4 px-4">
                             <div className="space-y-2">
                               <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-[10px] uppercase tracking-wider px-2 py-0">Korwil</Badge>
                                 <span className="text-sm font-bold text-slate-700 line-clamp-1">{desa.nama_korwil}</span>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] uppercase tracking-wider px-2 py-0">Relawan</Badge>
                                 <span className="text-sm font-bold text-slate-700 line-clamp-1">{desa.nama_relawan}</span>
                               </div>
                             </div>
                           </td>
                           <td className="py-4 px-4 text-center">
                             <Button size="sm" variant="outline" onClick={() => handleUnassign(desa.id, desa.nama_desa)} className="h-8 rounded-lg px-3 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm transition-colors">
                               <Trash2 className="w-3.5 h-3.5 mr-1" /> Unassign
                             </Button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
            
            {/* Modal Assign Desa */}
            {isAssignOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                 <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <div>
                         <h3 className="text-lg font-black text-slate-800">Assign Desa ke Regional</h3>
                         <p className="text-xs text-slate-500 font-medium">Pilih desa yang belum terafiliasi dengan Office manapun.</p>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => setIsAssignOpen(false)} className="rounded-full hover:bg-slate-200">
                          <X className="w-5 h-5 text-slate-500" />
                       </Button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 bg-white">
                      {unassignedDesa.length === 0 ? (
                        <div className="text-center py-12">
                          <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">Semua desa telah ter-assign ke suatu Office.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-end mb-4 px-1">
                             <span className="text-sm font-bold text-slate-700">Pilih dari {unassignedDesa.length} Desa Tersedia</span>
                             <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">{selectedToAssign.length} Terpilih</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {unassignedDesa.map(desa => (
                              <label key={desa.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedToAssign.includes(desa.id) ? 'border-indigo-600 ring-1 ring-indigo-600/50 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                                <Checkbox 
                                  className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                  checked={selectedToAssign.includes(desa.id)}
                                  onCheckedChange={() => handleToggleAssign(desa.id)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-800 leading-tight">{desa.nama_desa}</p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">{desa.nama_kota}, {desa.nama_provinsi}</p>
                                  <div className="flex gap-2 mt-1.5">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded truncate max-w-[80px]">R: {desa.nama_relawan}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded truncate max-w-[80px]">K: {desa.nama_korwil}</span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                       <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Batal</Button>
                       <Button disabled={selectedToAssign.length === 0 || isSubmitting} onClick={handleAssignSubmit} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20">
                         {isSubmitting ? 'Memproses...' : `Assign ${selectedToAssign.length} Desa`}
                       </Button>
                    </div>
                 </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
