'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  Stethoscope, 
  Calendar, 
  User, 
  ChevronRight,
  ChevronDown,
  Filter,
  Trash2,
  Edit,
  Baby,
  Heart,
  Activity,
  Check,
  LayoutGrid,
  List,
  Download,
  Clock
} from 'lucide-react'
import { getKesehatanUpdates, deleteKesehatanUpdate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function KesehatanPage() {
  const router = useRouter()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'selesai'>('all')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getKesehatanUpdates()
      setUpdates(data)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    try {
      await deleteKesehatanUpdate(id)
      toast.success('Data berhasil dihapus')
      loadData()
    } catch (err) {
      toast.error('Gagal menghapus data')
    }
  }

  const filteredUpdates = updates.filter(u => {
    const matchSearch = u.nama_pm.toLowerCase().includes(searchQuery.toLowerCase()) || u.nik_pm.includes(searchQuery)
    const matchStatus = statusFilter === 'all' ? true : (statusFilter === 'pending' ? !u.checked : u.checked)
    return matchSearch && matchStatus
  })

  const groupedByKelompok = filteredUpdates.reduce((acc, curr) => {
    const kId = curr.kelompok_id || 'tanpa_kelompok'
    const kNama = curr.nama_kelompok || 'Tanpa Kelompok'
    
    if (!acc[kId]) {
      acc[kId] = {
        kelompok_id: kId,
        nama_kelompok: kNama,
        members: {}
      }
    }
    
    const pmId = curr.penerima_manfaat_id
    if (!acc[kId].members[pmId]) {
      acc[kId].members[pmId] = {
        penerima_manfaat_id: pmId,
        nama_pm: curr.nama_pm,
        nik_pm: curr.nik_pm,
        program_kesehatan: curr.program_kesehatan,
        is_anak: curr.is_anak,
        is_ibu: curr.is_ibu,
        is_lansia: curr.is_lansia,
        updates: Array(12).fill(null)
      }
    }
    
    acc[kId].members[pmId].updates[curr.bulan - 1] = curr
    return acc
  }, {} as Record<string, any>)

  const groupsArray = Object.values(groupedByKelompok).map((g: any) => ({
    ...g,
    membersArray: Object.values(g.members)
  }))

  const toggleGroup = (kId: string) => {
    setExpandedGroups(prev => ({ ...prev, [kId]: !prev[kId] }))
  }

  const getBulanName = (month: number) => {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return names[month - 1] || '-'
  }

  const exportToExcel = () => {
    const dataToExport = filteredUpdates.map((u: any) => ({
      'Kelompok': u.nama_kelompok || 'Tanpa Kelompok',
      'Nama PM': u.nama_pm,
      'NIK': u.nik_pm,
      'Tahun': u.tahun,
      'Bulan': getBulanName(u.bulan),
      'Status Verifikasi': u.checked ? 'Selesai' : 'Draft',
      'Relawan': u.nama_relawan || '',
      'Status Kader': u.is_kader ? 'Ya' : 'Bukan',
      'Program Kesehatan': u.program_kesehatan || '',
      // Anak
      'Tgl Pemeriksaan Anak': u.tgl_pemeriksaan_anak ? new Date(u.tgl_pemeriksaan_anak).toLocaleDateString('id-ID') : '',
      'Nama Ibu (Anak)': u.anak_nama_ibu || '',
      'Anak Ke': u.anak_ke || '',
      'Tgl Lahir Anak': u.anak_tgl_lahir ? new Date(u.anak_tgl_lahir).toLocaleDateString('id-ID') : '',
      'BB Lahir Anak (kg)': u.anak_bb_lahir || 0,
      'Berat Badan Anak (kg)': u.anak_berat_badan || 0,
      'Tinggi Badan Anak (cm)': u.anak_tinggi_badan || 0,
      'Lingkar Kepala Anak (cm)': u.anak_lingkar_kepala || 0,
      'Asi Eksklusif (Bulan)': u.anak_asi_eksklusif || 0,
      'Pendampingan Khusus Anak': u.anak_pendampingan_khusus || '',
      'IMD Anak': u.anak_imd ? 'Ya' : 'Tidak',
      'Diare Anak': u.anak_menderita_diare ? 'Ya' : 'Tidak',
      'Imunisasi Anak': u.anak_imunisasi ? (typeof u.anak_imunisasi === 'string' ? JSON.parse(u.anak_imunisasi).join(', ') : u.anak_imunisasi.join(', ')) : '',
      // Ibu
      'Tgl Pemeriksaan Ibu': u.tgl_pemeriksaan_ibu ? new Date(u.tgl_pemeriksaan_ibu).toLocaleDateString('id-ID') : '',
      'NIK Ibu': u.ibu_nik || '',
      'Tgl Lahir Ibu': u.ibu_tgl_lahir ? new Date(u.ibu_tgl_lahir).toLocaleDateString('id-ID') : '',
      'Berat Badan Ibu Sebelum Hamil (kg)': u.ibu_bb_sebelum_hamil || 0,
      'Berat Badan Ibu Hamil (kg)': u.ibu_berat_badan || 0,
      'Tinggi Badan Ibu Hamil (cm)': u.ibu_tinggi_badan || 0,
      'LILA Ibu Hamil (cm)': u.ibu_lila || 0,
      'Umur Kehamilan (Bulan)': u.ibu_umur_kehamilan || 0,
      'Konsumsi TTD (HB)': u.ibu_hb ? 'Ya' : 'Tidak',
      'Imunisasi Ibu Hamil': u.ibu_imunisasi ? (typeof u.ibu_imunisasi === 'string' ? JSON.parse(u.ibu_imunisasi).join(', ') : u.ibu_imunisasi.join(', ')) : '',
      // Lansia
      'Tgl Pemeriksaan Lansia': u.tgl_pemeriksaan_lansia ? new Date(u.tgl_pemeriksaan_lansia).toLocaleDateString('id-ID') : '',
      'Tgl Lahir Lansia': u.lansia_tgl_lahir ? new Date(u.lansia_tgl_lahir).toLocaleDateString('id-ID') : '',
      'Berat Badan Lansia (kg)': u.lansia_berat_badan || 0,
      'Tinggi Badan Lansia (cm)': u.lansia_tinggi_badan || 0,
      'Tekanan Darah Lansia': u.lansia_tekanan_darah || '',
      'Kolesterol Lansia': u.lansia_kolesterol || 0,
      'Gula Darah Lansia': u.lansia_gula || 0,
      'Asam Urat Lansia': u.lansia_asam_urat || 0,
      'Aktivitas Harian Lansia': u.lansia_aktivitas_harian || '',
      'Penanggung Biaya Lansia': u.lansia_penanggung_biaya || '',
      'Status Kepemilikan BPJS Lansia': u.lansia_kepemilikan_bpjs || '',
      'Riwayat Penyakit Lansia': u.lansia_riwayat_penyakit || '',
      'Riwayat Pengobatan Lansia': u.lansia_riwayat_pengobatan || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kesehatan")
    XLSX.writeFile(workbook, "Data_Kesehatan_Detail.xlsx")
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Update Kesehatan</h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring kesehatan Penerima Manfaat Berkala.</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/kesehatan/tambah')}
          className="bg-[#7a1200] hover:bg-[#5a0d00] rounded-2xl px-6 h-12 font-bold shadow-lg shadow-[#7a1200]/20 gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Update
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border-none p-6">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 h-12 mb-6 border border-slate-100 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama atau NIK..."
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-slate-800 text-white rounded-xl' : 'rounded-xl text-slate-500'}
                >Semua</Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white rounded-xl' : 'rounded-xl text-slate-500'}
                >Pending</Button>
                <Button 
                  variant={statusFilter === 'selesai' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setStatusFilter('selesai')}
                  className={statusFilter === 'selesai' ? 'bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl' : 'rounded-xl text-slate-500'}
                >Selesai</Button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-lg h-8 px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-lg h-8 px-3 ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Table
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToExcel}
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10 px-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export Excel</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Memuat data...</div>
            ) : filteredUpdates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic">Tidak ada data ditemukan</div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 min-w-[200px]">Kelompok & PM</th>
                      <th className="px-4 py-3 min-w-[150px]">Program</th>
                      {Array.from({length: 12}).map((_, i) => (
                        <th key={i} className="px-2 py-3 text-center">{getBulanName(i+1).substring(0,3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {groupsArray.flatMap((group: any) => 
                       group.membersArray.map((person: any) => (
                         <tr key={person.penerima_manfaat_id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-4 py-3">
                             <div className="font-bold text-slate-800">{person.nama_pm}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{person.nik_pm}</div>
                             <div className="text-[10px] text-emerald-600 font-black tracking-widest mt-0.5">{group.nama_kelompok}</div>
                           </td>
                           <td className="px-4 py-3">
                             <div className="flex flex-wrap items-center gap-2 mt-1">
                               <Badge variant="secondary" className="bg-rose-50 text-rose-700 font-bold text-[10px] px-2 py-0 border-none">
                                 {person.program_kesehatan}
                               </Badge>
                               <div className="flex items-center gap-1">
                                 {person.is_anak && <Baby className="w-3 h-3 text-emerald-500" />}
                                 {person.is_ibu && <Heart className="w-3 h-3 text-rose-500" />}
                                 {person.is_lansia && <Activity className="w-3 h-3 text-blue-500" />}
                               </div>
                             </div>
                           </td>
                           {person.updates.map((update: any, idx: number) => (
                             <td 
                               key={idx} 
                               className={`px-2 py-3 text-center align-middle ${update ? 'cursor-pointer hover:bg-slate-100 transition-colors group' : ''}`}
                               onClick={() => update && router.push(`/dashboard/kesehatan/${update.id}/edit`)}
                               title={update ? "Klik untuk edit" : undefined}
                             >
                               {update ? (
                                  update.checked ? (
                                    <Check className="w-4 h-4 text-emerald-500 mx-auto shrink-0 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                  ) : (
                                    <div title="Draft" className="flex items-center justify-center">
                                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" strokeWidth={3} />
                                    </div>
                                  )
                               ) : (
                                  <span className="text-slate-300">-</span>
                               )}
                             </td>
                           ))}
                         </tr>
                       ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6">
                {groupsArray.map((group: any) => {
                  const isExpanded = expandedGroups[group.kelompok_id]
                  return (
                    <div key={group.kelompok_id} className="bg-white border text-black border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleGroup(group.kelompok_id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="font-bold text-slate-800 text-lg">{group.nama_kelompok}</h2>
                            <p className="text-xs text-slate-500 font-medium">{group.membersArray.length} Anggota PM</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 pointer-events-none">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                          <div className="space-y-4 mt-4">
                            {group.membersArray.map((person: any) => (
                              <div key={person.penerima_manfaat_id} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-rose-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors uppercase">
                                    {person.program_kesehatan?.includes('Stunting') ? 'STNT' : 'LNSA'}
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-800 tracking-tight">{person.nama_pm}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.nik_pm}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="bg-rose-50 text-rose-700 font-bold text-[10px] px-2 py-0 border-none">
                                        {person.program_kesehatan}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        {person.is_anak && <Baby className="w-3 h-3 text-emerald-500" />}
                                        {person.is_ibu && <Heart className="w-3 h-3 text-rose-500" />}
                                        {person.is_lansia && <Activity className="w-3 h-3 text-blue-500" />}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-4 pt-4 border-t border-slate-50">
                                  {person.updates.map((update: any, idx: number) => {
                                    const monthName = getBulanName(idx + 1).substring(0, 3)
                                    if (!update) {
                                      return (
                                        <div key={`empty-${idx}`} className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 border border-slate-100 opacity-50">
                                          <span className="text-[10px] font-bold text-slate-400">{monthName}</span>
                                          <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div 
                                        key={`update-${update.id}`}
                                        onClick={() => router.push(`/dashboard/kesehatan/${update.id}/edit`)}
                                        className={`group flex flex-col items-center justify-center py-2 rounded-xl border cursor-pointer transition-all hover:scale-105 shadow-sm ${
                                          update.checked 
                                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 border-solid' 
                                            : (update.is_anak || update.is_ibu || update.is_lansia
                                                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300 border-solid'
                                                : 'bg-white border-slate-200 border-dashed hover:border-amber-400 hover:bg-amber-50/50 border-2')
                                        }`}
                                        title={update.checked ? 'Selesai' : (update.is_anak || update.is_ibu || update.is_lansia ? 'Sudah Diisi (Draft) - Perlu Verify' : 'Belum Diisi - Klik untuk isi')}
                                      >
                                        <span className={`text-[10px] font-bold transition-colors ${update.checked ? 'text-emerald-700' : (update.is_anak || update.is_ibu || update.is_lansia ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600')}`}>{monthName}</span>
                                        {update.checked ? (
                                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 transition-colors" strokeWidth={4} />
                                        ) : (
                                          update.is_anak || update.is_ibu || update.is_lansia ? (
                                            <div className="w-2 h-2 rounded-full mt-1 bg-amber-500 transition-colors"></div>
                                          ) : (
                                            <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500 mt-0.5 transition-colors" strokeWidth={4} />
                                          )
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-rose-600 border-none shadow-xl shadow-rose-600/20 overflow-hidden rounded-[2rem] text-white">
            <CardContent className="p-8 space-y-4">
              <div className="p-3 bg-white/20 rounded-2xl w-fit">
                <Filter className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Estatistik</h3>
                <p className="text-rose-100/70 text-sm font-medium">Total update bulan ini</p>
              </div>
              <p className="text-4xl font-black">{updates.filter(u => u.bulan === new Date().getMonth() + 1).length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
