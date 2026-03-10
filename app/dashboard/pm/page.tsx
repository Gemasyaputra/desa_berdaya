'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, UserSquare2, Users, ChevronRight, Upload, Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import DeletePMButton from './DeletePMButton'
import ShortcutUploadKtp from './ShortcutUploadKtp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPenerimaManfaatList, getDesaBerdayaOptions, importPemerimaManfaatExcel } from './actions'
import { useSession } from 'next-auth/react'
import * as xlsx from 'xlsx'

export const dynamic = 'force-dynamic'

export default function PenerimaManfaatPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [list, setList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [filterKtpStatus, setFilterKtpStatus] = useState('all')

  const role = (session?.user as any)?.role
  const canAdd = role === 'RELAWAN' || role === 'PROG_HEAD'

  const fetchData = async () => {
    setLoading(true)
    try {
      const pms = await getPenerimaManfaatList()
      setList(pms)
      setFiltered(pms)
      const desas = await getDesaBerdayaOptions()
      setDesaOptions(desas)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user) return
    fetchData()
  }, [session])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      list.filter((pm) => {
        const matchesSearch = pm.nama?.toLowerCase().includes(q) ||
          pm.nik?.toLowerCase().includes(q) ||
          pm.nama_desa?.toLowerCase().includes(q) ||
          pm.kategori_pm?.toLowerCase().includes(q)
        
        const hasKtp = !!pm.foto_ktp_url
        const matchesKtp = filterKtpStatus === 'all' 
          ? true 
          : filterKtpStatus === 'uploaded' ? hasKtp : !hasKtp

        return matchesSearch && matchesKtp
      })
    )
  }, [search, filterKtpStatus, list])

  const handleDownloadTemplate = (desa: any) => {
    const wsData = [
      ['desa_berdaya_id', 'nama_desa', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'golongan_darah', 'alamat', 'rt_rw', 'kel_desa', 'kecamatan', 'agama', 'status_perkawinan', 'pekerjaan', 'kewarganegaraan', 'kategori_pm'],
      [desa.id, desa.nama_desa, '1234567890123456', 'Contoh Nama', 'Jakarta', '1990-01-01', 'Laki-Laki', 'O', 'Jl. Contoh No. 123', '01/02', 'Desa Contoh', 'Kec Contoh', 'Islam', 'Belum Kawin', 'Petani', 'WNI', 'Umum'],
    ]

    const ws = xlsx.utils.aoa_to_sheet(wsData)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'TemplatePM')
    xlsx.writeFile(wb, `Template_Import_PM_${desa.nama_desa.replace(/\s+/g, '_')}.xlsx`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = xlsx.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = xlsx.utils.sheet_to_json(ws)

        if (data.length === 0) {
          toast({ title: 'Error', description: 'File excel kosong.', variant: 'destructive' })
          setIsImporting(false)
          return
        }

        const formattedData = data.map((row: any) => ({
          desa_berdaya_id: parseInt(row.desa_berdaya_id),
          nik: String(row.nik || '').trim(),
          nama: row.nama,
          tempat_lahir: row.tempat_lahir,
          tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir).toISOString() : null,
          jenis_kelamin: row.jenis_kelamin,
          golongan_darah: row.golongan_darah,
          alamat: row.alamat,
          rt_rw: row.rt_rw,
          kel_desa: row.kel_desa,
          kecamatan: row.kecamatan,
          agama: row.agama,
          status_perkawinan: row.status_perkawinan,
          pekerjaan: row.pekerjaan,
          kewarganegaraan: row.kewarganegaraan,
          kategori_pm: row.kategori_pm
        }))

        const res = await importPemerimaManfaatExcel(formattedData)
        if (res.success) {
          toast({ 
            title: 'Import Berhasil', 
            description: `${res.successCount} data berhasil diimport.${res.errorCount > 0 ? ` ${res.errorCount} data gagal.` : ''}` 
          })
          fetchData()
        } else {
          toast({ title: 'Import Gagal', description: 'Gagal mengimport data.', variant: 'destructive' })
        }
        
        if (res.errors && res.errors.length > 0) {
          console.error("Import errors:", res.errors)
        } else {
          setIsImportModalOpen(false)
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Gagal memproses file.', variant: 'destructive' })
      } finally {
        setIsImporting(false)
        if (e.target) e.target.value = '' // reset file input
      }
    }
    reader.readAsBinaryString(file)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Penerima Manfaat</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola data penerima manfaat per desa binaan</p>
          </div>
          {canAdd && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1 shrink-0">
                <Upload className="w-4 h-4" /> Import Excel
              </Button>
              <Link href="/dashboard/pm/tambah">
                <Button size="sm" style={{ backgroundColor: '#7a1200' }} className="text-white gap-1 shrink-0">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah PM</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-3">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, desa, kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]"
            />
          </div>
          
          <Select value={filterKtpStatus} onValueChange={setFilterKtpStatus}>
            <SelectTrigger className="w-full sm:w-[200px] h-[42px] border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#7a1200]/20 focus:outline-none focus:border-[#7a1200] text-sm font-normal">
              <SelectValue placeholder="Status KTP" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="rounded-lg">Semua Status KTP</SelectItem>
              <SelectItem value="uploaded" className="rounded-lg">Sudah Upload KTP</SelectItem>
              <SelectItem value="missing" className="rounded-lg text-red-600 focus:text-red-700">Belum Upload KTP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!loading && (
          <p className="text-xs text-slate-400">{filtered.length} penerima manfaat ditemukan</p>
        )}

        {/* ── MOBILE: Card layout (hidden on md+) ── */}
        <div className="md:hidden space-y-3">
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {list.length === 0 ? 'Belum ada data penerima manfaat.' : 'Tidak ada hasil yang cocok'}
              </p>
            </div>
          )}

          {!loading && filtered.map((pm) => (
            <div key={pm.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] shrink-0">
                    <UserSquare2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{pm.nama}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{pm.nik}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {pm.kategori_pm}
                      </span>
                      {pm.foto_ktp_url ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          KTP: Ada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          KTP: Belum
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{pm.nama_desa}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2">
                {!pm.foto_ktp_url && canAdd && (
                  <ShortcutUploadKtp pmId={pm.id} onSuccess={fetchData} />
                )}
                <Link href={`/dashboard/pm/${pm.id}`}>
                  <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50 h-8 text-xs gap-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href={`/dashboard/pm/${pm.id}/edit`}>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 h-8 text-xs">Edit</Button>
                </Link>
                <DeletePMButton 
                  id={pm.id} 
                  onDeleted={(deletedId) => {
                    setList(prev => prev.filter((item) => item.id !== deletedId))
                    setFiltered(prev => prev.filter((item) => item.id !== deletedId))
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP: Table layout (hidden below md) ── */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {list.length === 0 ? 'Belum ada data penerima manfaat.' : 'Tidak ada hasil yang cocok'}
                  </td></tr>
                ) : filtered.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] shrink-0">
                          <UserSquare2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 flex items-center gap-2">
                            {pm.nama}
                            {pm.foto_ktp_url ? (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100" title="Foto KTP Tersedia">
                                 KTP
                               </span>
                            ) : (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100" title="Foto KTP Belum Diupload">
                                 No KTP
                               </span>
                            )}
                          </p>
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
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {pm.nama_desa}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!pm.foto_ktp_url && canAdd && (
                          <ShortcutUploadKtp pmId={pm.id} onSuccess={fetchData} />
                        )}
                        <Link href={`/dashboard/pm/${pm.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#7a1200] hover:bg-red-50">Detail</Button>
                        </Link>
                        <Link href={`/dashboard/pm/${pm.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                        </Link>
                        <DeletePMButton 
                          id={pm.id} 
                          onDeleted={(deletedId) => {
                            setList(prev => prev.filter((item) => item.id !== deletedId))
                            setFiltered(prev => prev.filter((item) => item.id !== deletedId))
                          }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Penerima Manfaat</DialogTitle>
            <DialogDescription>
              Ikuti langkah berikut untuk memasukkan data Penerima Manfaat sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center bg-slate-100 rounded-full w-5 h-5 text-xs">1</span> 
                Download Template
              </Label>
              <p className="text-sm text-slate-500 pl-7">
                Pilih desa di bawah ini untuk mengunduh template Excel yang sudah diisi dengan ID Desa yang sesuai.
              </p>
              <div className="pl-7 space-y-2">
                {desaOptions.length === 0 ? (
                  <p className="text-xs text-red-500">Anda tidak memiliki akses ke desa binaan manapun.</p>
                ) : (
                  desaOptions.map((desa) => (
                    <Button 
                      key={desa.id} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadTemplate(desa)} 
                      className="w-full justify-start text-slate-600"
                    >
                      <Download className="w-4 h-4 mr-2 text-blue-500" />
                      Template untuk Desa {desa.nama_desa}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center bg-slate-100 rounded-full w-5 h-5 text-xs">2</span> 
                Upload File Excel
              </Label>
              <p className="text-sm text-slate-500 pl-7">
                Pastikan data sudah diisi sesuai format di dalam template sebelum diupload.
              </p>
              <div className="pl-7">
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isImporting || desaOptions.length === 0}
                    title="Pilih file Excel"
                  />
                  <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${isImporting ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-emerald-200 hover:bg-emerald-50'}`}>
                    {isImporting ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-emerald-700 font-medium">Sedang memproses...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-emerald-700">Pilih / Tarik File ke Sini</p>
                        <p className="text-xs text-emerald-600/70 mt-1">Format: .xlsx</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
