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
  Check
} from 'lucide-react'
import { getKesehatanUpdates, deleteKesehatanUpdate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function KesehatanPage() {
  const router = useRouter()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'selesai'>('all')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

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
            
            <div className="flex items-center gap-2 mb-6">
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

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Memuat data...</div>
            ) : filteredUpdates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic">Tidak ada data ditemukan</div>
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
