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
  Filter,
  Trash2,
  Edit
} from 'lucide-react'
import { getEkonomiUpdates, deleteEkonomiUpdate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function EkonomiPage() {
  const router = useRouter()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredUpdates = updates.filter(u => 
    u.nama_pm.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nik_pm.includes(searchQuery)
  )

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
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Update Ekonomi</h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring status ekonomi Penerima Manfaat secara berkala.</p>
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
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 h-12 mb-6 border border-slate-100 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama atau NIK..."
                className="bg-transparent border-none outline-none text-sm font-medium w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Memuat data...</div>
            ) : filteredUpdates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic">Tidak ada data ditemukan</div>
            ) : (
              <div className="space-y-4">
                {filteredUpdates.map((item) => (
                  <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        #PM
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 tracking-tight">{item.nama_pm}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.nik_pm}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none font-bold text-[10px] px-2 py-0">
                            {item.kategori}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase">
                            <Calendar className="w-3 h-3" /> {getBulanName(item.bulan)} {item.tahun}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/ekonomi/${item.id}/edit`)} className="rounded-xl hover:text-blue-600 hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/ekonomi/${item.id}`)} className="rounded-xl hover:text-emerald-600 hover:bg-emerald-50">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-emerald-600 border-none shadow-xl shadow-emerald-600/20 overflow-hidden rounded-[2rem] text-white">
            <CardContent className="p-8 space-y-4">
              <div className="p-3 bg-white/20 rounded-2xl w-fit">
                <Filter className="w-6 h-6" />
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
