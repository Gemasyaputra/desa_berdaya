'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Calendar, 
  User, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Trash2,
  Edit,
  Check,
  LayoutGrid,
  List,
  Download,
  Clock
} from 'lucide-react'
import { getEkonomiUpdates, deleteEkonomiUpdate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function EkonomiPage() {
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
      const data = await getEkonomiUpdates()
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
      await deleteEkonomiUpdate(id)
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
        kategori: curr.kategori,
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
      'Kategori': u.kategori || '',
      'Tipe Usaha': u.tipe || '',
      'Komoditas/Produk': u.komoditas_produk || '',
      'Program': u.program || '',
      'Jumlah Tanggungan': u.jumlah_tanggungan || 0,
      'Modal (Rp)': u.modal || 0,
      'Pengeluaran Operasional (Rp)': u.pengeluaran_operasional || 0,
      'Omzet (Rp)': u.omzet || 0,
      'Pendapatan Utama (Rp)': u.pendapatan || 0,
      'Pendapatan Lainnya (Rp)': u.pendapatan_lainnya || 0,
      'Status Golongan Kemiskinan': u.status_gk || '',
      'Nilai NTP': u.nilai_ntp || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Ekonomi")
    XLSX.writeFile(workbook, "Data_Ekonomi_Detail.xlsx")
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Update Ekonomi</h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring Status Ekonomi Penerima Manfaat Secara Berkala.</p>
          </div>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/ekonomi/tambah')}
          className="bg-[#7a1200] hover:bg-[#5a0d00] rounded-2xl px-6 h-12 font-bold shadow-lg shadow-[#7a1200]/20 gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Update
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border-none p-6">
            <div className="relative flex items-center mb-6">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Cari nama atau NIK..."
                className="w-full bg-slate-50 rounded-2xl pl-12 pr-4 h-12 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Semua</Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('pending')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600'}`}
                >Pending</Button>
                <Button 
                  variant={statusFilter === 'selesai' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('selesai')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'selesai' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
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
                      <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Kelompok & PM</th>
                      <th className="px-4 py-3 min-w-[120px]">Kategori</th>
                      {Array.from({length: 12}).map((_, i) => (
                        <th key={i} className="px-2 py-3 text-center">{getBulanName(i+1).substring(0,3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {groupsArray.flatMap((group: any) => 
                       group.membersArray.map((person: any) => (
                         <tr key={person.penerima_manfaat_id} className="hover:bg-slate-50/50 transition-colors group/row">
                           <td className="px-4 py-3 sticky left-0 bg-white group-hover/row:bg-slate-50 z-10 border-r border-slate-100/50">
                             <div className="font-bold text-slate-800">{person.nama_pm}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{person.nik_pm}</div>
                             <div className="text-[10px] text-emerald-600 font-black tracking-widest mt-0.5">{group.nama_kelompok}</div>
                           </td>
                           <td className="px-4 py-3">
                             <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0 border-none">
                               {person.kategori || 'Ekonomi'}
                             </Badge>
                           </td>
                           {person.updates.map((update: any, idx: number) => (
                             <td 
                               key={idx} 
                               className={`px-2 py-3 text-center align-middle ${update ? 'cursor-pointer hover:bg-slate-100 transition-colors group' : ''}`}
                               onClick={() => update && router.push(`/dashboard/ekonomi/${update.id}/edit`)}
                               title={update ? "Klik untuk edit" : undefined}
                             >
                               {update ? (
                                  update.checked ? (
                                    <Check className="w-5 h-5 text-emerald-600 mx-auto shrink-0 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                  ) : (
                                    <div title="Draft" className="flex items-center justify-center">
                                      <Clock className="w-5 h-5 text-amber-600 shrink-0 group-hover:scale-110 transition-all" strokeWidth={3} />
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
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
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
                              <div key={person.penerima_manfaat_id} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors uppercase">
                                    #PM
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-800 tracking-tight">{person.nama_pm}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.nik_pm}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0 border-none">
                                        {person.kategori || 'Ekonomi'}
                                      </Badge>
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
                                        onClick={() => router.push(`/dashboard/ekonomi/${update.id}/edit`)}
                                        className={`group flex flex-col items-center justify-center py-2 rounded-xl border cursor-pointer transition-all hover:scale-105 shadow-sm ${
                                          update.checked 
                                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 border-solid' 
                                            : (update.kategori && update.kategori !== '-'
                                                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300 border-solid'
                                                : 'bg-white border-slate-200 border-dashed hover:border-amber-400 hover:bg-amber-50/50 border-2')
                                        }`}
                                        title={update.checked ? 'Selesai' : (update.kategori && update.kategori !== '-' ? 'Sudah Diisi (Draft) - Perlu Verify' : 'Belum Diisi - Klik untuk isi')}
                                      >
                                        <span className={`text-[10px] font-bold transition-colors ${update.checked ? 'text-emerald-700' : (update.kategori && update.kategori !== '-' ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600')}`}>{monthName}</span>
                                        {update.checked ? (
                                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 transition-colors" strokeWidth={4} />
                                        ) : (
                                          update.kategori && update.kategori !== '-' ? (
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
          <Card className="bg-emerald-600 border-none shadow-xl shadow-emerald-600/20 overflow-hidden rounded-[2rem] text-white">
            <CardContent className="p-8 space-y-4">
              <div className="p-3 bg-white/20 rounded-2xl w-fit">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Estatistik</h3>
                <p className="text-emerald-100/70 text-sm font-medium">Total update bulan ini</p>
              </div>
              <p className="text-4xl font-black">{updates.filter(u => u.bulan === new Date().getMonth() + 1).length}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
