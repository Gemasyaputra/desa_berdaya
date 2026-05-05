'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlusCircle, Trash2, Save, ArrowLeft, Users } from 'lucide-react'
import { getDesaBerdayaOptions } from '@/app/dashboard/laporan-kegiatan/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getKategoriPrograms } from '@/lib/actions/program'
import { createActionPlan, getPenerimaManfaatByDesa } from '@/lib/actions/action-plan'

export default function TambahActionPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  
  // Data Induk
  const [desaId, setDesaId] = useState<number>(0)
  const [kategoriProgram, setKategoriProgram] = useState<string>('')
  const [pilihanProgram, setPilihanProgram] = useState<string>('')
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [tahunAktivasi, setTahunAktivasi] = useState<number>(new Date().getFullYear())
  
  // Field Dinamis Opsional
  const [keteranganSe, setKeteranganSe] = useState('')
  const [jenisSampah, setJenisSampah] = useState('')
  const [kapasitasPengelolaan, setKapasitasPengelolaan] = useState<number | ''>('')
  const [jumlahPengajar, setJumlahPengajar] = useState<number | ''>('')
  const [jumlahPp, setJumlahPp] = useState<number | ''>('')
  const [fokusProgram, setFokusProgram] = useState('')
  const [cakupanProgram, setCakupanProgram] = useState('')
  const [sasaranProgram, setSasaranProgram] = useState('')
  const [legalitas, setLegalitas] = useState('')

  // RAB (Activities)
  const [activities, setActivities] = useState<any[]>([
    { id: Date.now(), bulan_implementasi: '', uraian_kebutuhan: '', nominal_rencana: '', jumlah_unit: '', frekuensi: '', harga_satuan: '' }
  ])

  // PM Khusus Ekonomi
  const [pmList, setPmList] = useState<any[]>([]) // Daftar PM dari server
  const [selectedPms, setSelectedPms] = useState<any[]>([]) // Yang di-check user
  const [isPmModalOpen, setIsPmModalOpen] = useState(false)

  useEffect(() => {
    getDesaBerdayaOptions().then(opts => setDesaOptions(opts))
    getKategoriPrograms().then(opts => setKategoriOptions(opts))
  }, [])

  useEffect(() => {
    if (kategoriProgram && kategoriOptions.length > 0) {
      const kat = kategoriOptions.find(k => k.nama_kategori.toUpperCase() === kategoriProgram.toUpperCase())
      if (kat) {
        import('@/app/dashboard/laporan-kegiatan/actions').then(m => {
          m.getProgramsByCategory(kat.id).then(progs => {
            setProgramOptions(progs)
            // Jika pilihan program sebelumnya tidak ada di options baru, reset
            if (progs.length > 0 && !progs.some(p => p.nama_program === pilihanProgram)) {
              setPilihanProgram('')
            }
          })
        })
      } else {
        setProgramOptions([])
      }
    } else {
      setProgramOptions([])
    }
  }, [kategoriProgram, kategoriOptions])

  useEffect(() => {
    if (desaId && kategoriProgram === 'EKONOMI') {
      getPenerimaManfaatByDesa(desaId).then(data => {
        setPmList(data)
      })
    } else {
      setPmList([])
      setSelectedPms([])
    }
  }, [desaId, kategoriProgram])

  const calculateTotalAjuan = () => {
    let total = 0
    activities.forEach(act => {
      if (kategoriProgram === 'EKONOMI') {
        const u = Number(act.jumlah_unit) || 0
        const f = Number(act.frekuensi) || 0
        const h = Number(act.harga_satuan) || 0
        total += (u * f * h)
      } else {
        total += Number(act.nominal_rencana) || 0
      }
    })
    return total
  }

  const handleAddActivity = () => {
    setActivities([
      ...activities, 
      { id: Date.now(), bulan_implementasi: '', uraian_kebutuhan: '', nominal_rencana: '', jumlah_unit: '', frekuensi: '', harga_satuan: '' }
    ])
  }

  const handleRemoveActivity = (id: number) => {
    setActivities(activities.filter(a => a.id !== id))
  }

  const handleActivityChange = (id: number, field: string, value: string) => {
    setActivities(activities.map(a => {
      if (a.id === id) {
        const newAct = { ...a, [field]: value }
        // Auto calculate nominal_rencana for EKONOMI
        if (kategoriProgram === 'EKONOMI' && ['jumlah_unit', 'frekuensi', 'harga_satuan'].includes(field)) {
          const u = Number(newAct.jumlah_unit) || 0
          const f = Number(newAct.frekuensi) || 0
          const h = Number(newAct.harga_satuan) || 0
          newAct.nominal_rencana = u * f * h
        }
        return newAct
      }
      return a
    }))
  }

  const togglePmSelection = (pm: any) => {
    const isSelected = selectedPms.some(p => p.pm_id === pm.id)
    if (isSelected) {
      setSelectedPms(selectedPms.filter(p => p.pm_id !== pm.id))
    } else {
      setSelectedPms([...selectedPms, { pm_id: pm.id, nama: pm.nama, penghasilan_awal: '', tanggungan: '', status_gk: '', status_hk: '', selisih_gk: '', nib_halal: '' }])
    }
  }

  const handleSelectAllPms = () => {
    if (selectedPms.length === pmList.length) {
      setSelectedPms([])
    } else {
      setSelectedPms(pmList.map(pm => ({ pm_id: pm.id, nama: pm.nama, penghasilan_awal: '', tanggungan: '', status_gk: '', status_hk: '', selisih_gk: '', nib_halal: '' })))
    }
  }

  const updatePmField = (pm_id: number, field: string, value: string) => {
    setSelectedPms(selectedPms.map(p => {
      if (p.pm_id !== pm_id) return p;

      const updated = { ...p, [field]: value };
      
      // Auto Calculation
      if (field === 'tanggungan' || field === 'penghasilan_awal') {
        const tggn = Number(updated.tanggungan) || 0;
        const penghasilan = Number(updated.penghasilan_awal) || 0;
        
        const gk = tggn * 582932;
        const hk = tggn * 940169;
        const selisih = gk - penghasilan;

        updated.status_gk = gk > 0 ? gk.toString() : '';
        updated.status_hk = hk > 0 ? hk.toString() : '';
        updated.selisih_gk = (gk > 0 || penghasilan > 0) ? selisih.toString() : '';
      }

      return updated;
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!desaId || !kategoriProgram || activities.length === 0) {
      alert('Mohon lengkapi Desa, Kategori Program, dan setidaknya 1 baris RAB.')
      return
    }

    setLoading(true)

    const payloadInduk = {
      desa_berdaya_id: desaId,
      kategori_program: kategoriProgram,
      pilihan_program: pilihanProgram,
      tahun_aktivasi: tahunAktivasi,
      total_ajuan: calculateTotalAjuan(),
      keterangan_se: keteranganSe,
      jenis_sampah: jenisSampah,
      kapasitas_pengelolaan: kapasitasPengelolaan === '' ? undefined : Number(kapasitasPengelolaan),
      jumlah_pengajar: jumlahPengajar === '' ? undefined : Number(jumlahPengajar),
      jumlah_pp: jumlahPp === '' ? undefined : Number(jumlahPp),
      fokus_program: fokusProgram,
      cakupan_program: cakupanProgram,
      sasaran_program: sasaranProgram,
      legalitas: legalitas
    }

    const payloadActivities = activities.map(a => ({
      bulan_implementasi: String(a.bulan_implementasi),
      uraian_kebutuhan: String(a.uraian_kebutuhan),
      nominal_rencana: Number(a.nominal_rencana),
      jumlah_unit: a.jumlah_unit ? Number(a.jumlah_unit) : undefined,
      frekuensi: a.frekuensi ? Number(a.frekuensi) : undefined,
      harga_satuan: a.harga_satuan ? Number(a.harga_satuan) : undefined
    }))

    const payloadBeneficiaries = selectedPms.map(p => ({
      pm_id: p.pm_id,
      penghasilan_awal: p.penghasilan_awal ? Number(p.penghasilan_awal) : undefined,
      tanggungan: p.tanggungan ? Number(p.tanggungan) : undefined,
      status_gk: p.status_gk,
      status_hk: p.status_hk,
      selisih_gk: p.selisih_gk ? Number(p.selisih_gk) : undefined,
      nib_halal: p.nib_halal
    }))

    const result = await createActionPlan(payloadInduk, payloadActivities, payloadBeneficiaries)
    
    setLoading(false)
    if (result.success) {
      router.push('/dashboard/action-plan')
    } else {
      alert('Gagal menyimpan: ' + result.error)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Action Plan</h1>
          <p className="text-slate-500 text-sm mt-1">Ajukan Rencana Anggaran Biaya (RAB) Program</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bagian 1: Data Induk */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Informasi Umum</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Desa Binaan <span className="text-rose-500">*</span></label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                value={desaId}
                onChange={(e) => setDesaId(Number(e.target.value))}
                required
              >
                <option value={0}>Pilih Desa...</option>
                {desaOptions.map((o: any) => (
                  <option key={o.id} value={o.id}>{o.nama_desa}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Kategori Program <span className="text-rose-500">*</span></label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-colors"
                value={kategoriProgram}
                onChange={(e) => setKategoriProgram(e.target.value)}
                required
              >
                <option value="">Pilih Kategori...</option>
                <option value="EKONOMI">Program Ekonomi</option>
                <option value="PENDIDIKAN">Program Pendidikan</option>
                <option value="KESEHATAN">Program Kesehatan</option>
                <option value="LINGKUNGAN">Program Lingkungan</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Pilihan Program</label>
              <select 
                value={pilihanProgram}
                onChange={(e) => setPilihanProgram(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
              >
                <option value="">Pilih Program...</option>
                {programOptions.map((p: any) => (
                  <option key={p.id} value={p.nama_program}>{p.nama_program}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tahun Aktivasi</label>
              <input 
                type="number" 
                value={tahunAktivasi}
                onChange={(e) => setTahunAktivasi(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Bagian 2: Field Dinamis */}
        {kategoriProgram && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Detail Spesifik Program ({kategoriProgram})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Field Pendidikan */}
              {kategoriProgram === 'PENDIDIKAN' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Fokus Program</label>
                    <input type="text" value={fokusProgram} onChange={e => setFokusProgram(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jumlah Peserta PP (Program Partisipan)</label>
                    <input type="number" value={jumlahPp} onChange={e => setJumlahPp(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jumlah Pengajar</label>
                    <input type="number" value={jumlahPengajar} onChange={e => setJumlahPengajar(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                </>
              )}

              {/* Field Lingkungan */}
              {kategoriProgram === 'LINGKUNGAN' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Cakupan Program</label>
                    <input type="text" value={cakupanProgram} onChange={e => setCakupanProgram(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Legalitas</label>
                    <input type="text" value={legalitas} onChange={e => setLegalitas(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jenis Sampah <span className="text-rose-500">*</span></label>
                    <input type="text" value={jenisSampah} onChange={e => setJenisSampah(e.target.value)} required className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kapasitas Pengelolaan / tahun (kg)</label>
                    <input type="number" value={kapasitasPengelolaan} onChange={e => setKapasitasPengelolaan(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                </>
              )}

              {/* Field Kesehatan */}
              {kategoriProgram === 'KESEHATAN' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Cakupan Program</label>
                    <input type="text" value={cakupanProgram} onChange={e => setCakupanProgram(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Sasaran Program</label>
                    <input type="text" value={sasaranProgram} onChange={e => setSasaranProgram(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Rencana Jumlah PP (Program Partisipan)</label>
                    <input type="number" value={jumlahPp} onChange={e => setJumlahPp(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50" />
                  </div>
                </>
              )}

              {/* Keterangan SE (Kesehatan/Lingkungan) */}
              {(kategoriProgram === 'KESEHATAN' || kategoriProgram === 'LINGKUNGAN') && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Keterangan SE (Social Enterprise) <span className="text-rose-500">*</span></label>
                  <textarea 
                    value={keteranganSe} 
                    onChange={e => setKeteranganSe(e.target.value)} 
                    required 
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bagian 3: Target Peserta (Khusus Ekonomi) */}
        {kategoriProgram === 'EKONOMI' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-slate-800">Target Penerima Manfaat (PM)</h2>
              <Dialog open={isPmModalOpen} onOpenChange={setIsPmModalOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="sm" variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-50 gap-2">
                    <Users className="w-4 h-4" /> Pilih PM dari Database
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2 pr-4">
                      <DialogTitle>Pilih Penerima Manfaat Desa</DialogTitle>
                      {pmList.length > 0 && (
                        <Button type="button" variant="outline" size="sm" onClick={handleSelectAllPms} className="text-teal-700 border-teal-200 hover:bg-teal-50">
                          {selectedPms.length === pmList.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                        </Button>
                      )}
                    </div>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!desaId ? (
                      <p className="text-slate-500 text-center py-4">Silakan pilih Desa Binaan terlebih dahulu di atas.</p>
                    ) : pmList.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Tidak ada data PM di desa ini.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {pmList.map(pm => {
                          const isSelected = selectedPms.some(p => p.pm_id === pm.id)
                          return (
                            <label key={pm.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 text-teal-600 rounded"
                                checked={isSelected}
                                onChange={() => togglePmSelection(pm)}
                              />
                              <div>
                                <div className="font-semibold text-slate-800">{pm.nama}</div>
                                <div className="text-xs text-slate-500">NIK: {pm.nik}</div>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {selectedPms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left min-w-[150px]">Nama PM</th>
                      <th className="p-3 text-left min-w-[100px]">Tanggungan</th>
                      <th className="p-3 text-left min-w-[120px]">Penghasilan (Rp)</th>
                      <th className="p-3 text-left min-w-[120px]">Status GK</th>
                      <th className="p-3 text-left min-w-[120px]">Status HK</th>
                      <th className="p-3 text-left min-w-[120px]">Selisih GK (Rp)</th>
                      <th className="p-3 text-left min-w-[100px]">NIB/Halal</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPms.map(pm => (
                      <tr key={pm.pm_id}>
                        <td className="p-3 font-medium text-slate-700">{pm.nama}</td>
                        <td className="p-2"><input type="number" placeholder="Jumlah" value={pm.tanggungan} onChange={(e) => updatePmField(pm.pm_id, 'tanggungan', e.target.value)} className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-xs" /></td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            placeholder="Rp..." 
                            value={pm.penghasilan_awal ? Number(pm.penghasilan_awal).toLocaleString('id-ID') : ''} 
                            onChange={(e) => updatePmField(pm.pm_id, 'penghasilan_awal', e.target.value.replace(/\D/g, ''))} 
                            className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-xs" 
                          />
                        </td>
                        <td className="p-2"><input type="text" readOnly placeholder="Auto" value={pm.status_gk ? Number(pm.status_gk).toLocaleString('id-ID') : ''} className="w-full p-2 border border-transparent bg-slate-100 rounded text-xs text-slate-600 outline-none" /></td>
                        <td className="p-2"><input type="text" readOnly placeholder="Auto" value={pm.status_hk ? Number(pm.status_hk).toLocaleString('id-ID') : ''} className="w-full p-2 border border-transparent bg-slate-100 rounded text-xs text-slate-600 outline-none" /></td>
                        <td className="p-2"><input type="text" readOnly placeholder="Auto" value={pm.selisih_gk ? Number(pm.selisih_gk).toLocaleString('id-ID') : ''} className="w-full p-2 border border-transparent bg-slate-100 rounded text-xs font-semibold text-slate-700 outline-none" /></td>
                        <td className="p-2"><input type="text" placeholder="NIB..." value={pm.nib_halal} onChange={(e) => updatePmField(pm.pm_id, 'nib_halal', e.target.value)} className="w-full p-2 border border-slate-200 rounded bg-slate-50 text-xs" /></td>
                        <td className="p-2 text-center">
                          <button type="button" onClick={() => togglePmSelection({ id: pm.pm_id })} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 text-sm text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                Belum ada PM yang dipilih. Wajib pilih minimal 1 PM untuk Program Ekonomi.
              </div>
            )}
          </div>
        )}

        {/* Bagian 4: RAB Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h2>
            <div className="font-bold text-xl text-teal-700 bg-teal-50 px-4 py-1.5 rounded-lg border border-teal-100">
              Total: Rp {calculateTotalAjuan().toLocaleString('id-ID')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-3 font-semibold text-left">Bulan Implementasi</th>
                  <th className="p-3 font-semibold text-left">Uraian Kebutuhan</th>
                  
                  {kategoriProgram === 'EKONOMI' ? (
                    <>
                      <th className="p-3 font-semibold text-left w-24">Jumlah</th>
                      <th className="p-3 font-semibold text-left w-24">Frekuensi</th>
                      <th className="p-3 font-semibold text-left w-36">Harga Satuan</th>
                      <th className="p-3 font-semibold text-left w-40">Nominal (Total)</th>
                    </>
                  ) : (
                    <th className="p-3 font-semibold text-left w-48">Nominal Rencana</th>
                  )}
                  <th className="p-3 text-center w-12">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activities.map((act, index) => (
                  <tr key={act.id}>
                    <td className="p-2 align-top">
                      <input 
                        type="text" 
                        placeholder="Cth: Februari" 
                        required
                        value={act.bulan_implementasi}
                        onChange={(e) => handleActivityChange(act.id, 'bulan_implementasi', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white"
                      />
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        rows={2}
                        placeholder="Deskripsi kebutuhan..." 
                        required
                        value={act.uraian_kebutuhan}
                        onChange={(e) => handleActivityChange(act.id, 'uraian_kebutuhan', e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white resize-none"
                      />
                    </td>
                    
                    {kategoriProgram === 'EKONOMI' ? (
                      <>
                        <td className="p-2 align-top">
                          <input type="number" required value={act.jumlah_unit} onChange={(e) => handleActivityChange(act.id, 'jumlah_unit', e.target.value)} className="w-full p-2 border border-slate-200 rounded bg-slate-50" />
                        </td>
                        <td className="p-2 align-top">
                          <input type="number" required value={act.frekuensi} onChange={(e) => handleActivityChange(act.id, 'frekuensi', e.target.value)} className="w-full p-2 border border-slate-200 rounded bg-slate-50" />
                        </td>
                        <td className="p-2 align-top">
                          <input type="number" required value={act.harga_satuan} onChange={(e) => handleActivityChange(act.id, 'harga_satuan', e.target.value)} className="w-full p-2 border border-slate-200 rounded bg-slate-50" />
                        </td>
                        <td className="p-2 align-top">
                          <input type="number" readOnly value={act.nominal_rencana} className="w-full p-2 border border-transparent bg-slate-100 font-bold text-slate-700 rounded outline-none" />
                        </td>
                      </>
                    ) : (
                      <td className="p-2 align-top">
                        <input 
                          type="number" 
                          required
                          value={act.nominal_rencana}
                          onChange={(e) => handleActivityChange(act.id, 'nominal_rencana', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white"
                        />
                      </td>
                    )}

                    <td className="p-2 align-top text-center pt-3">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveActivity(act.id)}
                        disabled={activities.length === 1}
                        className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" variant="outline" onClick={handleAddActivity} className="w-full border-dashed border-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 gap-2">
            <PlusCircle className="w-4 h-4" /> Tambah Baris RAB
          </Button>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button type="submit" disabled={loading} className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto min-w-[150px]">
            {loading ? 'Menyimpan...' : (
              <><Save className="w-4 h-4 mr-2" /> Submit Pengajuan</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
