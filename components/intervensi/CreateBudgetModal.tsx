'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { createAnggaran, updateAnggaran } from '@/app/dashboard/intervensi/actions'

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  headerData: any;
  editData?: any;
}

export default function CreateBudgetModal({ isOpen, onClose, onSaved, headerData, editData }: CreateBudgetModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Initialize from editData or defaults
  const [formData, setFormData] = useState({
    tahun: editData?.tahun || new Date().getFullYear(),
    bulan: editData?.bulan || 'Januari',
    ajuan_ri: editData?.ajuan_ri || 0,
    anggaran_disetujui: editData?.anggaran_disetujui || 0,
    anggaran_dicairkan: editData?.anggaran_dicairkan || 0,
    status_pencairan: editData?.status_pencairan || 'Dialokasikan',
    id_stp: editData?.id_stp || '',
    catatan: editData?.catatan || '',
    is_dbf: editData?.is_dbf || false,
    is_rz: editData?.is_rz || false,
  })

  // Reset safely when open or editData changes (Not perfectly robust but enough for this scope)
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        tahun: editData?.tahun || new Date().getFullYear(),
        bulan: editData?.bulan || 'Januari',
        ajuan_ri: editData?.ajuan_ri || 0,
        anggaran_disetujui: editData?.anggaran_disetujui || 0,
        anggaran_dicairkan: editData?.anggaran_dicairkan || 0,
        status_pencairan: editData?.status_pencairan || 'Dialokasikan',
        id_stp: editData?.id_stp || '',
        catatan: editData?.catatan || '',
        is_dbf: editData?.is_dbf || false,
        is_rz: editData?.is_rz || false,
      })
    }
  }, [isOpen, editData])

  const handleSubmit = async (e: React.FormEvent, isSaveAndNew: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const payload = {
        ...formData,
        intervensi_program_id: headerData.id
      }
      
      let res;
      if (editData?.id) {
        res = await updateAnggaran(editData.id, payload)
      } else {
        res = await createAnggaran(payload)
      }
      
      if (res.success) {
        import('sonner').then(m => m.toast.success("Anggaran berhasil disimpan!"))
        onSaved()
        if (isSaveAndNew) {
          // Reset form for new entry
          setFormData(prev => ({
             ...prev, 
             bulan: 'Januari', 
             ajuan_ri: 0, 
             anggaran_disetujui: 0, 
             anggaran_dicairkan: 0, 
             id_stp: '', 
             catatan: ''
          }))
        } else {
          onClose()
        }
      }
    } catch (err: any) {
      console.error(err)
      import('sonner').then(m => m.toast.error(err.message || "Gagal menyimpan anggaran"))
    } finally {
      setLoading(false)
    }
  }

  const bulanOptions = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto w-[95%]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{editData ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
          <DialogDescription>
            Rencanakan anggaran intervensi untuk bulan spesifik.
          </DialogDescription>
        </DialogHeader>
        
        <form id="budget-form" onSubmit={(e) => handleSubmit(e, false)}>
          <div className="space-y-6 pt-4 pb-8">
            {/* Read-Only Header Info Section */}
            <div>
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3 border-b pb-1">Anggaran & Pencairan</h4>
              <div className="grid grid-cols-2 gap-4 gap-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-2 font-medium">
                  <span className="w-32 font-semibold text-slate-800">Desa Berdaya:</span> 
                  {headerData?.nama_desa}
                </div>
                <div className="flex gap-2 font-medium">
                  <span className="w-32 font-semibold text-slate-800">Program:</span> 
                  {headerData?.nama_program}
                </div>
                <div className="col-span-2 flex gap-2 font-medium">
                  <span className="w-32 font-semibold text-slate-800">Kategori Prog.:</span> 
                  {headerData?.kategori_program}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tahun <span className="text-rose-500">*</span></Label>
                  <Input 
                    type="number" 
                    value={formData.tahun} 
                    onChange={e => setFormData(p => ({ ...p, tahun: Number(e.target.value) }))} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bulan <span className="text-rose-500">*</span></Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.bulan}
                    onChange={e => setFormData(p => ({ ...p, bulan: e.target.value }))}
                  >
                    {bulanOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ajuan RI</Label>
                  <Input type="number" step="1000" value={formData.ajuan_ri} onChange={e => setFormData(p => ({ ...p, ajuan_ri: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Anggaran Disetujui</Label>
                  <Input type="number" step="1000" value={formData.anggaran_disetujui} onChange={e => setFormData(p => ({ ...p, anggaran_disetujui: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Anggaran Dicairkan</Label>
                  <Input type="number" step="1000" value={formData.anggaran_dicairkan} onChange={e => setFormData(p => ({ ...p, anggaran_dicairkan: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>State/Status</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.status_pencairan}
                    onChange={e => setFormData(p => ({ ...p, status_pencairan: e.target.value }))}
                  >
                    <option value="Dialokasikan">Dialokasikan</option>
                    <option value="Pending">Pending</option>
                    <option value="Dicairkan">Dicairkan</option>
                    <option value="Dikembalikan">Dikembalikan</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label>ID STP</Label>
                  <Input value={formData.id_stp} onChange={e => setFormData(p => ({ ...p, id_stp: e.target.value }))} placeholder="Reference number STP" />
                </div>
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label>Catatan</Label>
                  <Input value={formData.catatan} onChange={e => setFormData(p => ({ ...p, catatan: e.target.value }))} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="is_dbf" checked={formData.is_dbf} onCheckedChange={(c: boolean) => setFormData(p => ({ ...p, is_dbf: c }))} />
                  <Label htmlFor="is_dbf">Is DBF?</Label>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="is_rz" checked={formData.is_rz} onCheckedChange={(c: boolean) => setFormData(p => ({ ...p, is_rz: c }))} />
                  <Label htmlFor="is_rz">Is RZ?</Label>
                </div>
              </div>
            </div>

            {/* Read-Only Relawan Section */}
            <div className="pt-4 mt-8 border-t">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-4 border-b pb-1">Informasi Relawan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Relawan</span>
                    <span className="font-semibold">{headerData?.relawan_nama || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Email</span>
                    <span className="font-medium">{headerData?.relawan_email || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Telepon / Phone</span>
                    <span className="font-medium">{headerData?.relawan_telepon || '-'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Bank Account</span>
                    <span className="font-medium">{headerData?.relawan_no_rekening || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Nama Bank</span>
                    <span className="font-medium">{headerData?.relawan_nama_bank || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Atas Nama</span>
                    <span className="font-medium">{headerData?.relawan_atas_nama || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="bg-slate-50 w-[calc(100%+3rem)] -ml-6 -mb-6 p-4 rounded-b-xl border-t sm:justify-start gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-slate-200">
              Discard
            </Button>
            <div className="flex gap-2 ml-auto">
               <Button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20">
                 Save & New
               </Button>
               <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20">
                 {loading ? 'Menyimpan...' : 'Save & Close'}
               </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
