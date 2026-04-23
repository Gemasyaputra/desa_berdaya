'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, Edit2, Trash2, Filter, Settings, Save, X, CheckSquare, Square } from 'lucide-react'
import { getAllFilterConfigs, saveFilterConfig, deleteFilterConfig, getDatabaseSchema } from './actions'

export default function FilterBuilderPage() {
  const [filters, setFilters] = useState<any[]>([])
  const [dbSchema, setDbSchema] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [selectedTable, setSelectedTable] = useState<string>('')
  
  // State untuk form bulk creation/editing
  // Key: column_name
  const [activeColumns, setActiveColumns] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [resFilters, resSchema] = await Promise.all([
      getAllFilterConfigs(),
      getDatabaseSchema()
    ])
    
    if (resFilters.success) {
      setFilters(resFilters.data)
    } else {
      toast.error('Gagal memuat filter')
    }

    if (resSchema.success) {
      setDbSchema(resSchema.data)
    }
    
    setLoading(false)
  }

  // Ketika tabel dipilih, kita siapkan state activeColumns berdasarkan filter yang sudah ada di DB
  const handleSelectTable = (table: string) => {
    setSelectedTable(table)
    
    const existingFilters = filters.filter(f => f.page_key === table)
    const newActiveCols: Record<string, any> = {}
    
    existingFilters.forEach(f => {
      newActiveCols[f.column_name || f.filter_key] = {
        id: f.id,
        label: f.label,
        filter_type: f.filter_type,
        optionsList: f.options || [],
        filter_key: f.filter_key
      }
    })
    
    setActiveColumns(newActiveCols)
  }

  const toggleColumn = (col: string) => {
    const newActiveCols = { ...activeColumns }
    if (newActiveCols[col]) {
      // Jika dicentang ulang dan belum pernah disimpan (id tidak ada), hapus dari state
      if (!newActiveCols[col].id) {
        delete newActiveCols[col]
      } else {
        toast.info('Filter ini sudah ada di database. Gunakan tombol Hapus di bawah jika ingin menghapusnya permanen.')
      }
    } else {
      // Tambahkan default
      newActiveCols[col] = {
        id: null,
        label: col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        filter_type: 'text',
        optionsList: [],
        filter_key: col
      }
    }
    setActiveColumns(newActiveCols)
  }

  const updateColumnConfig = (col: string, field: string, value: any) => {
    setActiveColumns({
      ...activeColumns,
      [col]: {
        ...activeColumns[col],
        [field]: value
      }
    })
  }

  const handleSaveBulk = async () => {
    if (!selectedTable) return
    setSaving(true)
    
    try {
      const activeColKeys = Object.keys(activeColumns)
      if (activeColKeys.length === 0) {
        toast.error('Pilih setidaknya satu kolom untuk dijadikan filter')
        setSaving(false)
        return
      }

      for (let i = 0; i < activeColKeys.length; i++) {
        const col = activeColKeys[i]
        const conf = activeColumns[col]
        
        if (conf.filter_type === 'select' && (!conf.optionsList || conf.optionsList.length === 0)) {
           toast.error(`Opsi untuk filter ${conf.label} tidak boleh kosong!`)
           setSaving(false)
           return
        }

        await saveFilterConfig({
          id: conf.id,
          page_key: selectedTable,
          filter_key: conf.filter_key,
          label: conf.label,
          filter_type: conf.filter_type,
          options: conf.filter_type === 'select' ? conf.optionsList : null,
          column_name: col,
          sort_order: i, // auto sort order based on selection order
          is_active: true
        })
      }
      
      toast.success('Konfigurasi filter berhasil disimpan!')
      loadData()
      setSelectedTable('')
    } catch (e) {
      toast.error('Terjadi kesalahan saat menyimpan')
    }
    
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus filter ini?')) return
    const res = await deleteFilterConfig(id)
    if (res.success) {
      toast.success('Filter dihapus')
      // Update local state if currently viewing that table
      if (selectedTable) {
        handleSelectTable(selectedTable)
      } else {
        loadData()
      }
    } else {
      toast.error('Gagal menghapus filter')
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#7a1200]/10 border border-[#7a1200]/20 rounded-2xl flex items-center justify-center">
            <Filter className="w-7 h-7 text-[#7a1200]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Filter Builder Cepat</h1>
            <p className="text-sm font-medium text-slate-500">Pilih Halaman, Centang Kolom, dan Selesai.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Pemilihan Halaman/Tabel */}
        <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-slate-100 h-fit lg:col-span-1">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-sm font-bold text-slate-700">1. Pilih Halaman / Fitur</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : (
              Object.keys(dbSchema).map(table => {
                const isSelected = selectedTable === table
                const activeCount = filters.filter(f => f.page_key === table).length
                return (
                  <button
                    key={table}
                    onClick={() => handleSelectTable(table)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                      isSelected 
                        ? 'bg-[#7a1200]/5 border-[#7a1200]/30 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`font-bold text-sm ${isSelected ? 'text-[#7a1200]' : 'text-slate-700'}`}>
                      {table.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">{table}</span>
                      {activeCount > 0 && (
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0.5">
                          {activeCount} Filter Aktif
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Pengaturan Kolom Filter */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedTable ? (
            <div className="text-center p-16 bg-white rounded-3xl border border-slate-100 h-full flex flex-col justify-center">
              <Settings className="w-16 h-16 mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Pilih Fitur Terlebih Dahulu</h3>
              <p className="text-slate-500 text-sm mt-2">Pilih salah satu halaman atau tabel di sebelah kiri untuk mulai mengatur kolom mana yang ingin dijadikan filter pencarian.</p>
            </div>
          ) : (
            <Card className="border-none shadow-xl shadow-slate-200/30 rounded-3xl overflow-hidden bg-white ring-1 ring-[#7a1200]/10">
              <CardHeader className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-[#7a1200]">
                    2. Centang Kolom untuk Filter
                  </CardTitle>
                  <CardDescription className="text-xs">Tabel: <span className="font-mono text-slate-600 font-bold">{selectedTable}</span></CardDescription>
                </div>
                <Button onClick={handleSaveBulk} disabled={saving} className="bg-[#7a1200] hover:bg-[#7a1200]/90 rounded-xl font-bold h-10 px-6 shadow-md shadow-[#7a1200]/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {dbSchema[selectedTable]?.map(col => {
                    const isActive = !!activeColumns[col]
                    const conf = activeColumns[col]

                    return (
                      <div key={col} className={`p-4 transition-colors ${isActive ? 'bg-[#7a1200]/[0.02]' : 'hover:bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => toggleColumn(col)}
                            className={`flex items-center justify-center w-6 h-6 rounded-md border ${isActive ? 'bg-[#7a1200] border-[#7a1200] text-white' : 'border-slate-300 text-transparent hover:border-[#7a1200]/50'}`}
                          >
                            {isActive ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          
                          <div className="flex-1 cursor-pointer select-none" onClick={() => toggleColumn(col)}>
                            <div className={`font-bold text-sm ${isActive ? 'text-[#7a1200]' : 'text-slate-700'}`}>
                              {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{col}</div>
                          </div>
                          
                          {isActive && conf.id && (
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0" onClick={() => handleDelete(conf.id)}>
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          )}
                        </div>

                        {/* Jika dicentang, buka pengaturan kecil */}
                        {isActive && (
                          <div className="mt-4 ml-10 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Label (Tampil di UI)</label>
                                <Input 
                                  value={conf.label} 
                                  onChange={e => updateColumnConfig(col, 'label', e.target.value)} 
                                  className="h-9 text-xs rounded-xl border-slate-200"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Input</label>
                                <select 
                                  className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#7a1200] bg-white"
                                  value={conf.filter_type}
                                  onChange={e => updateColumnConfig(col, 'filter_type', e.target.value)}
                                >
                                  <option value="text">Teks (Pencarian Biasa)</option>
                                  <option value="select">Dropdown (Pilihan)</option>
                                  <option value="date">Tanggal</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Konfigurasi Khusus Dropdown */}
                            {conf.filter_type === 'select' && (
                              <div className="pt-3 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opsi Pilihan</label>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      const newOpts = [...(conf.optionsList || []), {label: '', value: ''}]
                                      updateColumnConfig(col, 'optionsList', newOpts)
                                    }} 
                                    className="h-7 text-[10px] rounded-lg"
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Tambah Opsi
                                  </Button>
                                </div>
                                
                                {(!conf.optionsList || conf.optionsList.length === 0) ? (
                                  <div className="text-center p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50 text-[10px] text-slate-400">
                                    Tambahkan opsi untuk dropdown ini
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {conf.optionsList.map((opt: any, i: number) => (
                                      <div key={i} className="flex gap-2 items-center">
                                        <Input 
                                          placeholder="Label UI" 
                                          value={opt.label}
                                          onChange={e => {
                                            const newOpts = [...conf.optionsList]
                                            newOpts[i].label = e.target.value
                                            if (!newOpts[i].value) newOpts[i].value = e.target.value
                                            updateColumnConfig(col, 'optionsList', newOpts)
                                          }}
                                          className="h-8 text-xs rounded-lg" 
                                        />
                                        <Input 
                                          placeholder="Value DB" 
                                          value={opt.value}
                                          onChange={e => {
                                            const newOpts = [...conf.optionsList]
                                            newOpts[i].value = e.target.value
                                            updateColumnConfig(col, 'optionsList', newOpts)
                                          }}
                                          className="h-8 text-xs rounded-lg font-mono" 
                                        />
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => {
                                            const newOpts = [...conf.optionsList]
                                            newOpts.splice(i, 1)
                                            updateColumnConfig(col, 'optionsList', newOpts)
                                          }}
                                          className="h-8 w-8 shrink-0 text-slate-400 hover:text-rose-500"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
