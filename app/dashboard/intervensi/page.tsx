'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Target, LayoutGrid, Search, Filter, X, Check, FileSpreadsheet, Trash2, Download, Loader2, Copy, Layers, ChevronRight, ChevronLeft, Calendar, MapPin, BookOpen, ChevronsRight } from 'lucide-react'
import { getIntervensiPrograms, deleteIntervensiProgram, getIntervensiExportData, duplicateIntervensiProgram, getDesaBerdayaOptions, getProgramOptions, getIntervensiProgramsForDuplicate, bulkDuplicateIntervensi, getExistingMonthsForTarget, getOccupiedMonthsByProgramIds, getAnggaranForPreview } from './actions'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import ImportExcelModal from '@/components/intervensi/ImportExcelModal'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'


import { MultiSelectFilter } from '@/components/multi-select-filter'

export default function IntervensiListPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    desa: [] as string[],
    program: [] as string[],
    relawan: [] as string[],
    status: [] as string[]
  })
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Duplicate states
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [duplicateForm, setDuplicateForm] = useState({
    desa_id: '',
    program_id: ''
  })

  // Bulk Duplicate states
  const [bulkDupOpen, setBulkDupOpen] = useState(false)
  const [bdPrograms, setBdPrograms] = useState<any[]>([])
  const [bdLoading, setBdLoading] = useState(false)
  const [bdStep, setBdStep] = useState(1)
  // bdSelectedMonths: programId -> set of selected month strings
  const [bdSelectedMonths, setBdSelectedMonths] = useState<Record<number, Set<string>>>({})
  // bdExpanded: which program rows are expanded
  const [bdExpanded, setBdExpanded] = useState<Set<number>>(new Set())
  const [bdSearch, setBdSearch] = useState('')
  const [bdFilterDesa, setBdFilterDesa] = useState<string[]>([])
  const [bdFilterBulan, setBdFilterBulan] = useState<string[]>([])
  const [bdFilterProgram, setBdFilterProgram] = useState<string[]>([])
  const [bdTargetYear, setBdTargetYear] = useState(String(new Date().getFullYear()))
  const [bdTargetMonths, setBdTargetMonths] = useState<Set<string>>(new Set())
  const [bdOccupiedMonths, setBdOccupiedMonths] = useState<Set<string>>(new Set())
  const [bdMode, setBdMode] = useState<'basic' | 'advanced'>('basic')
  const [bdTargetDesaIds, setBdTargetDesaIds] = useState<Set<number>>(new Set())
  const [isBulkDuplicating, setIsBulkDuplicating] = useState(false)
  // Preview rows: editable before saving
  const [bdPreviewRows, setBdPreviewRows] = useState<Array<{
    key: string; programId: number; desaName: string; programName: string;
    sourceMonth: string; targetMonth: string;
    ajuan_ri: number; anggaran_disetujui: number; anggaran_dicairkan: number;
    is_dbf: boolean; is_rz: boolean;
  }>>([])
  const [bdSourceAnggaran, setBdSourceAnggaran] = useState<Record<number, Record<string, any>>>({})
  const [bdHasDraft, setBdHasDraft] = useState(false)

  const BD_DRAFT_KEY = 'bd_duplicate_draft'



  // Check for saved draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BD_DRAFT_KEY);
      if (saved) setBdHasDraft(true);
    } catch {}
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getIntervensiPrograms()
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique options for filters, cascading based on other active filters
  const filterOptions = useMemo(() => {
    // Helper to get available options by considering all filters EXCEPT the one we are evaluating
    const getOptions = (excludeKey: keyof typeof filters) => {
      return data.filter(row => {
        const q = search.toLowerCase()
        const matchesSearch = !q || (
          (row.nama_desa || '').toLowerCase().includes(q) ||
          (row.nama_program || '').toLowerCase().includes(q) ||
          (row.nama_relawan || '').toLowerCase().includes(q) ||
          (row.sumber_dana || '').toLowerCase().includes(q) ||
          (row.fundraiser || '').toLowerCase().includes(q)
        )

        const matchesDesa = excludeKey === 'desa' || filters.desa.length === 0 || filters.desa.includes(row.nama_desa)
        const matchesProgram = excludeKey === 'program' || filters.program.length === 0 || filters.program.includes(row.nama_program)
        const matchesRelawan = excludeKey === 'relawan' || filters.relawan.length === 0 || filters.relawan.includes(row.nama_relawan)
        const matchesStatus = excludeKey === 'status' || filters.status.length === 0 || filters.status.includes(row.status)

        return matchesSearch && matchesDesa && matchesProgram && matchesRelawan && matchesStatus
      })
    }

    const desas = Array.from(new Set(getOptions('desa').map(row => row.nama_desa).filter(Boolean))) as string[]
    const programs = Array.from(new Set(getOptions('program').map(row => row.nama_program).filter(Boolean))) as string[]
    const relawans = Array.from(new Set(getOptions('relawan').map(row => row.nama_relawan).filter(Boolean))) as string[]
    
    return {
      desa: desas.sort(),
      program: programs.sort(),
      relawan: relawans.sort(),
      status: ['DRAFT', 'APPROVED', 'CANCELLED']
    }
  }, [data, search, filters])

  const filtered = useMemo(() => {
    return data.filter(row => {
      // 1. Search filter
      const q = search.toLowerCase()
      const matchesSearch = !q || (
        (row.nama_desa || '').toLowerCase().includes(q) ||
        (row.nama_program || '').toLowerCase().includes(q) ||
        (row.nama_relawan || '').toLowerCase().includes(q) ||
        (row.sumber_dana || '').toLowerCase().includes(q) ||
        (row.fundraiser || '').toLowerCase().includes(q)
      )
      
      // 2. Multi-select filters
      const matchesDesa = filters.desa.length === 0 || filters.desa.includes(row.nama_desa)
      const matchesProgram = filters.program.length === 0 || filters.program.includes(row.nama_program)
      const matchesRelawan = filters.relawan.length === 0 || filters.relawan.includes(row.nama_relawan)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(row.status)
      
      return matchesSearch && matchesDesa && matchesProgram && matchesRelawan && matchesStatus
    })
  }, [data, search, filters])

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilters({
      desa: [],
      program: [],
      relawan: [],
      status: []
    })
  }

  const hasAnyFilter = search !== '' || 
    filters.desa.length > 0 || 
    filters.program.length > 0 || 
    filters.relawan.length > 0 || 
    filters.status.length > 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] font-bold tracking-wider">APPROVED</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 uppercase text-[10px] font-bold tracking-wider">CANCELLED</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 uppercase text-[10px] font-bold tracking-wider">DRAFT</Badge>
    }
  }

  const handleDelete = (row: any) => {
    setDeleteTarget(row)
  }

  // ── Selection helpers ───────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))
  const someFilteredSelected = filtered.some(r => selectedIds.has(r.id))

  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.add(r.id))
        return next
      })
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleExport = async () => {
    if (selectedIds.size === 0) return
    setIsExporting(true)
    try {
      const ids = Array.from(selectedIds)
      const rows = (await getIntervensiExportData(ids)) as any[]
      const XLSX = await import('xlsx')

      const BULAN_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
      const fmt = (n: any) => (n === null || n === undefined || n === '') ? 0 : Number(n)
      const fmtBool = (v: any) => (String(v).toLowerCase() === 'true' || v === true) ? 'Ya' : 'Tidak'

      const wb = XLSX.utils.book_new()

      const flatData = rows.map(r => ({
        'ID': r.intervensi_id,
        'Nama Desa': r.nama_desa || '-',
        'Kategori Program': r.kategori_program || '-',
        'Program': r.nama_program || '-',
        'Relawan': r.nama_relawan || '-',
        'Sumber Dana': r.sumber_dana || '-',
        'Fundraiser': r.fundraiser || '-',
        'Deskripsi': r.deskripsi || '-',
        'Status': r.status || '-',
        'Tanggal Dibuat': r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-',
        'Tahun': r.tahun || '-',
        'Bulan': r.bulan || '-',
        'Ajuan RI': fmt(r.ajuan_ri),
        'Agg. Disetujui': fmt(r.anggaran_disetujui),
        'Agg. Dicairkan': fmt(r.anggaran_dicairkan),
        'Status Pencairan': r.status_pencairan || '-',
        'ID STP': r.id_stp || '-',
        'Catatan': r.catatan || '-',
        'Is DBF': fmtBool(r.is_dbf),
        'Is RZ': fmtBool(r.is_rz),
      }))

      const ws = XLSX.utils.json_to_sheet(flatData)
      
      ws['!cols'] = [
        {wch:6},{wch:20},{wch:18},{wch:24},{wch:20},{wch:14},{wch:20},{wch:30},{wch:12},{wch:15},
        {wch:10},{wch:12},{wch:18},{wch:18},{wch:18},{wch:18},{wch:12},{wch:24},{wch:8},{wch:8}
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Data Intervensi')

      const now = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `export_intervensi_${now}.xlsx`)

      const { toast } = await import('sonner')
      const totalIntervensi = new Set(rows.map(r => r.intervensi_id)).size
      const totalAnggaran = rows.filter(r => r.anggaran_id != null).length
      toast.success(`Export berhasil! ${totalIntervensi} Intervensi disusun dalam 1 sheet.`)
    } catch (err: any) {
      const { toast } = await import('sonner')
      toast.error(err.message || 'Export gagal')
    } finally {
      setIsExporting(false)
    }
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteIntervensiProgram(deleteTarget.id)
      import('sonner').then(m => m.toast.success('Intervensi berhasil dihapus.'))
      loadData()
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message || 'Gagal menghapus intervensi'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDuplicateClick = async (row: any) => {
    setDuplicateTarget(row)
    setDuplicateForm({ desa_id: '', program_id: '' })
    if (desaOptions.length === 0 || programOptions.length === 0) {
      try {
        const [desas, progs] = await Promise.all([
          getDesaBerdayaOptions(),
          getProgramOptions()
        ])
        setDesaOptions(desas)
        setProgramOptions(progs)
      } catch (err) {
        import('sonner').then(m => m.toast.error('Gagal memuat opsi desa & program'))
      }
    }
  }

  const openBulkDup = async (resumeDraft = false) => {
    setBulkDupOpen(true)

    if (resumeDraft) {
      try {
        const saved = localStorage.getItem(BD_DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          setBdStep(draft.step ?? 1)
          // Re-hydrate Sets from arrays
          const months: Record<number, Set<string>> = {};
          for (const [k, v] of Object.entries(draft.selectedMonths ?? {})) {
            months[Number(k)] = new Set(v as string[]);
          }
          setBdSelectedMonths(months)
          setBdTargetYear(draft.targetYear ?? String(new Date().getFullYear()))
          setBdTargetMonths(new Set(draft.targetMonths ?? []))
          setBdMode(draft.mode ?? 'basic')
          setBdTargetDesaIds(new Set(draft.targetDesaIds ?? []))
          if (draft.previewRows) setBdPreviewRows(draft.previewRows)
        }
      } catch {}
    } else {
      setBdStep(1)
      setBdSelectedMonths({})
      setBdExpanded(new Set())
      setBdSearch('')
      setBdFilterDesa([])
      setBdFilterBulan([])
      setBdFilterProgram([])
      setBdMode('basic')
      setBdTargetDesaIds(new Set())
      setBdTargetMonths(new Set())
      setBdTargetYear(String(new Date().getFullYear()))
      setBdPreviewRows([])
    }

    if (bdPrograms.length === 0) {
      setBdLoading(true)
      try {
        const [programs, desas] = await Promise.all([
          getIntervensiProgramsForDuplicate(),
          desaOptions.length > 0 ? Promise.resolve(desaOptions) : getDesaBerdayaOptions()
        ])
        setBdPrograms(programs)
        setDesaOptions(desas)
      } catch {
        import('sonner').then(m => m.toast.error('Gagal memuat data'))
      } finally {
        setBdLoading(false)
      }
    }
  }

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!bulkDupOpen) return;
    try {
      const serializable: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(bdSelectedMonths)) {
        serializable[k] = Array.from(v);
      }
      const draft = {
        step: bdStep,
        selectedMonths: serializable,
        targetYear: bdTargetYear,
        targetMonths: Array.from(bdTargetMonths),
        mode: bdMode,
        targetDesaIds: Array.from(bdTargetDesaIds),
        previewRows: bdPreviewRows,
      };
      localStorage.setItem(BD_DRAFT_KEY, JSON.stringify(draft));
      setBdHasDraft(true);
    } catch {}
  }, [bulkDupOpen, bdStep, bdSelectedMonths, bdTargetYear, bdTargetMonths, bdMode, bdTargetDesaIds, bdPreviewRows])

  // Build/refresh preview rows when selections or targets change in Step 2
  useEffect(() => {
    if (bdStep !== 2) return;
    async function buildPreview() {
      const progIds = Object.keys(bdSelectedMonths).map(Number).filter(id => (bdSelectedMonths[id]?.size ?? 0) > 0);
      if (progIds.length === 0) { setBdPreviewRows([]); return; }

      // Fetch source anggaran data if not yet available
      let anggaranData = bdSourceAnggaran;
      const missing = progIds.filter(id => !anggaranData[id]);
      if (missing.length > 0) {
        const fresh = await getAnggaranForPreview(progIds);
        anggaranData = { ...anggaranData, ...fresh };
        setBdSourceAnggaran(anggaranData);
      }

      const MONTHS_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

      const newRows: typeof bdPreviewRows = [];
      for (const progId of progIds) {
        const prog = bdPrograms.find(p => p.id === progId);
        if (!prog) continue;
        const selectedSrcMonths = Array.from(bdSelectedMonths[progId] ?? []).sort(
          (a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b)
        );
        const targetMonthsList = bdTargetMonths.size > 0
          ? Array.from(bdTargetMonths).sort((a,b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b))
          : selectedSrcMonths;

        for (let i = 0; i < targetMonthsList.length; i++) {
          const targetMonth = targetMonthsList[i];
          // Use corresponding source month (or first if fewer source months)
          const srcMonth = selectedSrcMonths[i] ?? selectedSrcMonths[0];
          const srcData = anggaranData[progId]?.[srcMonth] ?? { ajuan_ri: 0, anggaran_disetujui: 0, anggaran_dicairkan: 0, is_dbf: false, is_rz: false };

          const key = `${progId}-${targetMonth}`;
          // Preserve user edits if row already exists
          const existing = bdPreviewRows.find(r => r.key === key);
          newRows.push(existing ?? {
            key,
            programId: progId,
            desaName: prog.nama_desa,
            programName: prog.nama_program,
            sourceMonth: srcMonth,
            targetMonth,
            ajuan_ri: srcData.ajuan_ri,
            anggaran_disetujui: srcData.anggaran_disetujui,
            anggaran_dicairkan: srcData.anggaran_dicairkan,
            is_dbf: srcData.is_dbf,
            is_rz: srcData.is_rz,
          });
        }
      }
      setBdPreviewRows(newRows);
    }
    buildPreview();
  }, [bdStep, bdSelectedMonths, bdTargetMonths, bdTargetYear])

  useEffect(() => {
    async function updateOccupied() {
      if (bdStep !== 2) return;
      const progIds = Object.keys(bdSelectedMonths)
        .map(Number)
        .filter(id => (bdSelectedMonths[id]?.size ?? 0) > 0);
      if (progIds.length === 0) { setBdOccupiedMonths(new Set()); return; }

      let allOccupied: string[] = [];

      if (bdMode === 'basic') {
        allOccupied = await getOccupiedMonthsByProgramIds(progIds, Number(bdTargetYear));
      } else {
        const desaIds = Array.from(bdTargetDesaIds);
        if (desaIds.length === 0) { setBdOccupiedMonths(new Set()); return; }
        const res = await getExistingMonthsForTarget(progIds, Number(bdTargetYear), desaIds);
        allOccupied = Array.from(new Set(Object.values(res).flat()));
      }

      setBdOccupiedMonths(new Set(allOccupied));
    }
    updateOccupied();
  }, [bdStep, bdTargetYear, bdTargetDesaIds, bdMode, bdSelectedMonths]);

  const executeBulkDuplicate = async () => {
    const sourceSelections = Object.entries(bdSelectedMonths)
      .map(([id, months]) => ({ programId: Number(id), months: Array.from(months) }))
      .filter(s => s.months.length > 0)
    if (sourceSelections.length === 0) return
    setIsBulkDuplicating(true)
    try {
      const targetDesaIds = bdMode === 'advanced' && bdTargetDesaIds.size > 0
        ? Array.from(bdTargetDesaIds)
        : undefined
      const targetMonths = bdTargetMonths.size > 0 ? Array.from(bdTargetMonths) : undefined
      const res = await bulkDuplicateIntervensi(sourceSelections, Number(bdTargetYear), targetDesaIds, targetMonths, bdPreviewRows)
      import('sonner').then(m => m.toast.success(`Berhasil! ${res.created} program berhasil diperbarui.`))
      // Clear draft
      try { localStorage.removeItem(BD_DRAFT_KEY); setBdHasDraft(false); } catch {}
      setBulkDupOpen(false)
      loadData()
      setBdPrograms([])
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message || 'Gagal menduplikasi'))
    } finally {
      setIsBulkDuplicating(false)
    }
  }

  const executeDuplicate = async () => {
    if (!duplicateTarget || !duplicateForm.desa_id || !duplicateForm.program_id) return
    setIsDuplicating(true)
    try {
      const selectedDesa = desaOptions.find(d => d.id === Number(duplicateForm.desa_id))
      const selectedProg = programOptions.find(p => p.id === Number(duplicateForm.program_id))
      
      const payload = {
        desa_berdaya_id: Number(duplicateForm.desa_id),
        program_id: Number(duplicateForm.program_id),
        kategori_program_id: selectedProg?.kategori_id,
        relawan_id: selectedDesa?.relawan_id // Automatically inherited from the chosen Desa
      }

      await duplicateIntervensiProgram(duplicateTarget.id, payload)
      import('sonner').then(m => m.toast.success('Intervensi berhasil diduplikasi ke DRAFT.'))
      loadData()
      setDuplicateTarget(null)
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message || 'Gagal menduplikasi intervensi'))
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#7a1200]/10 border border-[#7a1200]/20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
            <Target className="w-7 h-7 text-[#7a1200]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Intervensi Program</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Perencanaan dan alokasi anggaran program desa</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="border-[#7a1200]/40 text-[#7a1200] hover:bg-[#7a1200]/5 shadow-sm px-5 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start"
            onClick={() => setIsImportOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm leading-tight">Import Excel</span>
              <span className="text-[10px] font-medium text-[#7a1200]/60 leading-tight mt-0.5">Template tersedia di dalam</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-5 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start disabled:opacity-60"
            onClick={handleExport}
            disabled={isExporting || selectedIds.size === 0}
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />
              : <Download className="w-4 h-4 mt-0.5 flex-shrink-0" />
            }
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm leading-tight">{isExporting ? 'Mengexport...' : 'Export Excel'}</span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : 'Pilih baris dulu'}
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 shadow-sm px-5 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start"
            onClick={() => openBulkDup(false)}
          >
            <Layers className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm leading-tight">Duplikat Massal</span>
              <span className="text-[10px] font-medium text-indigo-400 leading-tight mt-0.5">Copy struktur ke tahun lain</span>
            </div>
          </Button>
          {bdHasDraft && (
            <Button
              variant="outline"
              className="border-amber-300 text-amber-600 hover:bg-amber-50 shadow-sm px-4 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start"
              onClick={() => openBulkDup(true)}
            >
              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm leading-tight">Lanjut Draft</span>
                <span className="text-[10px] font-medium text-amber-500 leading-tight mt-0.5">Duplikat belum selesai</span>
              </div>
            </Button>
          )}
          <Button 
            className="bg-[#7a1200] hover:bg-[#006e6b] text-white shadow-lg shadow-[#7a1200]/20 px-6 h-12 rounded-xl font-bold transition-all w-full md:w-auto active:scale-95"
            onClick={() => router.push('/dashboard/intervensi/tambah')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Intervensi
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#7a1200]" /> 
              Daftar Intervensi Program
              {!loading && (
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  ({filtered.length}/{data.length})
                </span>
              )}
            </CardTitle>

            {/* Selection action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-[#7a1200]/5 border border-[#7a1200]/20 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#7a1200] rounded-md flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                  </div>
                  <span className="text-sm font-bold text-[#7a1200]">{selectedIds.size} dipilih</span>
                </div>
                <div className="w-px h-4 bg-[#7a1200]/20" />
                <button
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={clearSelection}
                >
                  Batal pilih
                </button>
                <Button
                  size="sm"
                  className="bg-[#7a1200] hover:bg-[#006e6b] text-white rounded-xl font-bold px-4 h-8 gap-1.5 shadow-sm shadow-[#7a1200]/20"
                  disabled={isExporting}
                  onClick={handleExport}
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export {selectedIds.size} data
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {/* Search box */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Cari desa, program, relawan..."
                  className="pl-9 h-10 w-full sm:w-64 rounded-xl border-slate-200 text-sm shadow-sm focus:border-[#7a1200]/40 focus:ring-4 focus:ring-[#7a1200]/10 transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Multi Filters */}
                <MultiSelectFilter 
                  label="Desa" 
                  options={filterOptions.desa} 
                  selected={filters.desa}
                  onSelect={(val) => toggleFilter('desa', val)}
                  onClear={() => setFilters(f => ({ ...f, desa: [] }))}
                />

                <MultiSelectFilter 
                  label="Program" 
                  options={filterOptions.program} 
                  selected={filters.program}
                  onSelect={(val) => toggleFilter('program', val)}
                  onClear={() => setFilters(f => ({ ...f, program: [] }))}
                />

                <MultiSelectFilter 
                  label="Relawan" 
                  options={filterOptions.relawan} 
                  selected={filters.relawan}
                  onSelect={(val) => toggleFilter('relawan', val)}
                  onClear={() => setFilters(f => ({ ...f, relawan: [] }))}
                />

                <MultiSelectFilter 
                  label="Status" 
                  options={filterOptions.status} 
                  selected={filters.status}
                  onSelect={(val) => toggleFilter('status', val)}
                  onClear={() => setFilters(f => ({ ...f, status: [] }))}
                />

                {/* Clear all filters */}
                {hasAnyFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f8fafc] text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  {/* Select-all checkbox */}
                  <th className="px-5 py-4 w-10">
                    <div
                      className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                        allFilteredSelected
                          ? 'bg-[#7a1200] border-[#7a1200]'
                          : someFilteredSelected
                          ? 'bg-[#7a1200]/30 border-[#7a1200]'
                          : 'border-slate-300 hover:border-[#7a1200]/60'
                      }`}
                      onClick={toggleAllFiltered}
                      title={allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua'}
                    >
                      {(allFilteredSelected || someFilteredSelected) && (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />
                      )}
                    </div>
                  </th>
                  <th className="px-8 py-4 min-w-[200px]">Desa Binaan & Program</th>
                  <th className="px-8 py-4">Relawan</th>
                  <th className="px-8 py-4">Sumber Dana / Fundraiser</th>
                  <th className="px-8 py-4 whitespace-nowrap">Tanggal Dibuat</th>
                  <th className="px-8 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-8 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-medium whitespace-nowrap">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-14 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="w-6 h-6 opacity-30" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-600">Data tidak ditemukan</p>
                          <p className="text-xs text-slate-400">Coba ubah kata kunci atau bersihkan filter</p>
                        </div>
                        {hasAnyFilter && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2 rounded-xl text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold px-4" 
                            onClick={clearFilters}
                          >
                            Reset Semua Filter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        selectedIds.has(row.id) ? 'bg-[#7a1200]/5' : ''
                      }`}
                    >
                      {/* Per-row checkbox */}
                      <td className="px-5 py-5">
                        <div
                          className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                            selectedIds.has(row.id)
                              ? 'bg-[#7a1200] border-[#7a1200]'
                              : 'border-slate-300 hover:border-[#7a1200]/60'
                          }`}
                          onClick={() => toggleRow(row.id)}
                        >
                          {selectedIds.has(row.id) && (
                            <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 mb-1 group-hover:text-[#7a1200] transition-colors">{row.nama_desa || '-'}</div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7a1200]"></span>
                          {row.nama_program || '-'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-semibold text-slate-700">{row.nama_relawan || '-'}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-semibold text-slate-700">{row.sumber_dana || '-'}</div>
                        <div className="text-[11px] font-medium text-slate-400">{row.fundraiser || '-'}</div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-medium">
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-200 text-slate-600 hover:text-[#7a1200] hover:border-[#7a1200]/30 hover:bg-[#7a1200]/5 font-bold px-4 transition-all active:scale-95"
                            onClick={() => router.push(`/dashboard/intervensi/${row.id}`)}
                          >
                            Detail
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2 transition-all active:scale-95 group/copy relative"
                            onClick={() => handleDuplicateClick(row)}
                            title="Duplikasi Program"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {row.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 px-2 transition-all active:scale-95"
                              onClick={() => handleDelete(row)}
                              title="Hapus intervensi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => { loadData(); setIsImportOpen(false) }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-slate-800">
              Hapus Intervensi Program?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 space-y-2">
              <span className="block">Anda akan menghapus:</span>
              <span className="block bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-semibold">
                {deleteTarget?.nama_desa} — {deleteTarget?.nama_program}
              </span>
              <span className="block text-rose-500 font-medium">
                ⚠ Semua data anggaran yang terkait juga akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 gap-2"
              onClick={executeDelete}
            >
              <Trash2 className="w-4 h-4" />
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Modal */}
      <Dialog open={!!duplicateTarget} onOpenChange={(open) => !open && setDuplicateTarget(null)}>
        <DialogContent className="rounded-2xl max-w-lg bg-white p-6 shadow-2xl border-none">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Copy className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-800">Duplikasi Intervensi</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-500">
                  Salin kerangka anggaran ke desa binaan baru.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Data Asal:</div>
              <div className="font-bold text-slate-700 text-sm">{duplicateTarget?.nama_desa}</div>
              <div className="font-medium text-slate-600 text-xs">Program: {duplicateTarget?.nama_program}</div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pilih Desa Binaan Baru <span className="text-rose-500">*</span></label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200] hover:bg-slate-50/50 cursor-pointer transition-colors"
                  value={duplicateForm.desa_id}
                  onChange={(e) => setDuplicateForm(prev => ({...prev, desa_id: e.target.value}))}
                >
                  <option value="" disabled>-- Pilih Desa --</option>
                  {desaOptions.map(d => <option key={d.id} value={d.id}>{d.nama} {d.relawan_nama ? `— (${d.relawan_nama})` : ''}</option>)}
                </select>
                <p className="text-[10px] font-medium text-slate-400">Relawan akan otomatis mengikuti nama relawan yang terdaftar di Desa ini.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pilih Program Baru <span className="text-rose-500">*</span></label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200] hover:bg-slate-50/50 cursor-pointer transition-colors"
                  value={duplicateForm.program_id}
                  onChange={(e) => setDuplicateForm(prev => ({...prev, program_id: e.target.value}))}
                >
                  <option value="" disabled>-- Pilih Program --</option>
                  {programOptions.map(p => <option key={p.id} value={p.id}>{p.nama_program}</option>)}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setDuplicateTarget(null)}>
              Batal
            </Button>
            <Button 
              className="rounded-xl shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2 px-6"
              onClick={executeDuplicate}
              disabled={isDuplicating || !duplicateForm.desa_id || !duplicateForm.program_id}
            >
              {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              {isDuplicating ? 'Memproses...' : 'Duplikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── BULK DUPLICATE MODAL ─────────────────────────────────── */}
      <Dialog open={bulkDupOpen} onOpenChange={(open) => !open && setBulkDupOpen(false)}>
        <DialogContent className="max-w-3xl bg-white rounded-3xl border-none shadow-2xl p-0 [&>button]:hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-800">Duplikat Massal</DialogTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Langkah {bdStep} dari 2 — {bdStep === 1 ? 'Pilih program sumber' : 'Konfigurasi target'}
                </p>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                bdStep >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>1</div>
              <ChevronsRight className="w-4 h-4 text-slate-300" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                bdStep >= 2 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>2</div>
            </div>
          </div>

          {/* Step 1: Source Selection */}
          {bdStep === 1 && (() => {
            const BULAN_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
            const allBulan = BULAN_ORDER.filter(b =>
              bdPrograms.some(p => (p.bulan_list || []).includes(b))
            )
            const allDesasBd = Array.from(new Set(bdPrograms.map(p => p.nama_desa).filter(Boolean))).sort() as string[]
            const allProgramsBd = Array.from(new Set(bdPrograms.map(p => p.nama_program).filter(Boolean))).sort() as string[]

            const bdFiltered = bdPrograms.filter(p => {
              const q = bdSearch.toLowerCase()
              const matchQ = !q || (p.nama_desa||'').toLowerCase().includes(q) || (p.nama_program||'').toLowerCase().includes(q)
              const matchDesa = bdFilterDesa.length === 0 || bdFilterDesa.includes(p.nama_desa)
              const matchProgram = bdFilterProgram.length === 0 || bdFilterProgram.includes(p.nama_program)
              const matchBulan = bdFilterBulan.length === 0 || (p.bulan_list||[]).some((b: string) => bdFilterBulan.includes(b))
              return matchQ && matchDesa && matchProgram && matchBulan
            })
            
            const allFilteredSelected = bdFiltered.length > 0 && bdFiltered.every(p => {
              const all: string[] = p.bulan_list || []
              return all.length > 0 && all.every(b => bdSelectedMonths[p.id]?.has(b))
            })

            const isProgSelected = (id: number) => (bdSelectedMonths[id]?.size ?? 0) > 0
            const isMonthSelected = (id: number, b: string) => bdSelectedMonths[id]?.has(b) ?? false
            const allMonthsSelected = (p: any) => {
              const all: string[] = p.bulan_list || []
              return all.length > 0 && all.every(b => bdSelectedMonths[p.id]?.has(b))
            }
            const someSelected = Object.values(bdSelectedMonths).some(s => s.size > 0)
            const totalSelectedProgs = Object.keys(bdSelectedMonths).filter(k => (bdSelectedMonths[Number(k)]?.size ?? 0) > 0).length

            const toggleAllFiltered = () => {
              if (allFilteredSelected) {
                setBdSelectedMonths(prev => {
                  const next = { ...prev }
                  bdFiltered.forEach(p => delete next[p.id])
                  return next
                })
              } else {
                setBdSelectedMonths(prev => {
                  const next = { ...prev }
                  bdFiltered.forEach(p => {
                    next[p.id] = new Set(p.bulan_list || [])
                  })
                  return next
                })
              }
            }

            const toggleAllMonths = (p: any) => {
              const all: string[] = p.bulan_list || []
              setBdSelectedMonths(prev => {
                const next = { ...prev }
                if (allMonthsSelected(p)) {
                  delete next[p.id]
                } else {
                  next[p.id] = new Set(all)
                }
                return next
              })
            }

            const toggleMonth = (id: number, b: string) => {
              setBdSelectedMonths(prev => {
                const next = { ...prev }
                const cur = new Set(next[id] || [])
                cur.has(b) ? cur.delete(b) : cur.add(b)
                if (cur.size === 0) delete next[id]
                else next[id] = cur
                return next
              })
            }

            const toggleExpand = (id: number, e: React.MouseEvent) => {
              e.stopPropagation()
              setBdExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
            }

            return (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Filter bar */}
                <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/60 space-y-3 flex-shrink-0">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={bdSearch}
                        onChange={e => setBdSearch(e.target.value)}
                        placeholder="Cari desa atau program..."
                        className="w-full pl-9 pr-4 h-9 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                    </div>
                    {/* Filter Desa */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition-all ${
                          bdFilterDesa.length > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                          <MapPin className="w-3.5 h-3.5" />Desa
                          {bdFilterDesa.length > 0 && <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{bdFilterDesa.length}</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl" align="start">
                        <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2">Filter Desa</p>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto">
                          {allDesasBd.map(d => (
                            <button key={d} onClick={() => setBdFilterDesa(prev => prev.includes(d) ? prev.filter(x => x!==d) : [...prev, d])}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                bdFilterDesa.includes(d) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                              }`}>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                bdFilterDesa.includes(d) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                              }`}>{bdFilterDesa.includes(d) && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}</div>
                              {d}
                            </button>
                          ))}
                        </div>
                        {bdFilterDesa.length > 0 && <button onClick={() => setBdFilterDesa([])} className="w-full mt-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg py-1.5">Reset</button>}
                      </PopoverContent>
                    </Popover>
                    {/* Filter Program */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition-all ${
                          bdFilterProgram.length > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                          <BookOpen className="w-3.5 h-3.5" />Program
                          {bdFilterProgram.length > 0 && <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{bdFilterProgram.length}</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl" align="start">
                        <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2">Filter Program</p>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto">
                          {allProgramsBd.map(pg => (
                            <button key={pg} onClick={() => setBdFilterProgram(prev => prev.includes(pg) ? prev.filter(x => x!==pg) : [...prev, pg])}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                bdFilterProgram.includes(pg) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                              }`}>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                bdFilterProgram.includes(pg) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                              }`}>{bdFilterProgram.includes(pg) && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}</div>
                              {pg}
                            </button>
                          ))}
                        </div>
                        {bdFilterProgram.length > 0 && <button onClick={() => setBdFilterProgram([])} className="w-full mt-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg py-1.5">Reset</button>}
                      </PopoverContent>
                    </Popover>
                    {/* Filter Bulan */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className={`flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-bold transition-all ${
                          bdFilterBulan.length > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                          <Calendar className="w-3.5 h-3.5" />Bulan
                          {bdFilterBulan.length > 0 && <span className="bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">{bdFilterBulan.length}</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl" align="start">
                        <p className="text-[10px] font-black uppercase text-slate-400 px-2 mb-2">Filter Bulan</p>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto">
                          {allBulan.map(b => (
                            <button key={b} onClick={() => setBdFilterBulan(prev => prev.includes(b) ? prev.filter(x => x!==b) : [...prev, b])}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                                bdFilterBulan.includes(b) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                              }`}>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                                bdFilterBulan.includes(b) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                              }`}>{bdFilterBulan.includes(b) && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}</div>
                              {b}
                            </button>
                          ))}
                        </div>
                        {bdFilterBulan.length > 0 && <button onClick={() => setBdFilterBulan([])} className="w-full mt-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg py-1.5">Reset</button>}
                      </PopoverContent>
                    </Popover>
                    {(bdFilterDesa.length > 0 || bdFilterBulan.length > 0 || bdFilterProgram.length > 0 || bdSearch) && (
                      <button onClick={() => { setBdSearch(''); setBdFilterDesa([]); setBdFilterBulan([]); setBdFilterProgram([]) }}
                        className="h-9 px-3 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 border border-red-100 transition-all flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable list */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {bdLoading ? (
                    <div className="flex items-center justify-center py-16 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />Memuat data...
                    </div>
                  ) : bdFiltered.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">Tidak ada data yang cocok</div>
                  ) : bdFiltered.map(p => {
                    const months: string[] = p.bulan_list || []
                    const expanded = bdExpanded.has(p.id)
                    const allSel = allMonthsSelected(p)
                    const prog_sel = isProgSelected(p.id)
                    return (
                      <div key={p.id} className={`transition-colors ${ prog_sel ? 'bg-indigo-50/60' : '' }`}>
                        {/* Main row */}
                        <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/80 transition-colors">
                          {/* Select-all checkbox for this program */}
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                              allSel ? 'bg-indigo-500 border-indigo-500' :
                              prog_sel ? 'bg-indigo-200 border-indigo-400' :
                              'border-slate-300 hover:border-indigo-400'
                            }`}
                            onClick={() => toggleAllMonths(p)}
                          >
                            {allSel && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                            {prog_sel && !allSel && <div className="w-2 h-0.5 bg-indigo-600 rounded" />}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-sm">{p.nama_desa || '-'}</div>
                            <div className="text-xs text-slate-500">{p.nama_program || '-'} · {p.nama_relawan || '-'}</div>
                          </div>
                          {/* Month count badge */}
                          <div className="text-xs font-bold text-slate-400">
                            {prog_sel ? (
                              <span className="text-indigo-600">{bdSelectedMonths[p.id]?.size ?? 0}/{months.length} bulan</span>
                            ) : (
                              <span>{months.length} bulan</span>
                            )}
                          </div>
                          {/* Expand toggle */}
                          {months.length > 0 && (
                            <button
                              onClick={e => toggleExpand(p.id, e)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all flex-shrink-0"
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${ expanded ? 'rotate-90' : '' }`} />
                            </button>
                          )}
                        </div>
                        {/* Expanded month picker */}
                        {expanded && months.length > 0 && (
                          <div className="pl-12 pr-5 pb-3">
                            <div className="flex flex-wrap gap-1.5">
                              {BULAN_ORDER.filter(b => months.includes(b)).map(b => (
                                <button
                                  key={b}
                                  onClick={() => toggleMonth(p.id, b)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                    isMonthSelected(p.id, b)
                                      ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                  }`}
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Footer Step 1 */}
                <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
                  <div className="text-sm font-bold">
                    {someSelected
                      ? <span className="text-indigo-600">{totalSelectedProgs} program dipilih</span>
                      : <span className="text-slate-400">Pilih minimal 1 bulan dari 1 program</span>
                    }
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setBulkDupOpen(false)}>Batal</Button>
                    <Button
                      className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2 px-6 shadow-lg shadow-indigo-500/20"
                      disabled={!someSelected}
                      onClick={() => setBdStep(2)}
                    >
                      Lanjut <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Step 2: Target Config */}
          {bdStep === 2 && (() => {
            const TAHUN_OPTIONS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() + i - 1))
            const selectedProgramCount = Object.keys(bdSelectedMonths).filter(k => (bdSelectedMonths[Number(k)]?.size ?? 0) > 0).length
            const totalWillCreate = bdMode === 'advanced' && bdTargetDesaIds.size > 0
              ? selectedProgramCount * bdTargetDesaIds.size
              : selectedProgramCount
            return (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                  {/* Summary */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <p className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-2">Program yang akan diduplikasi</p>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {Object.entries(bdSelectedMonths)
                        .filter(([, months]) => months.size > 0)
                        .map(([id, months]) => {
                          const pg = bdPrograms.find(x => x.id === Number(id))
                          return pg ? (
                            <div key={id} className="flex items-start gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                              <div>
                                <span className="font-bold text-indigo-800">{pg.nama_desa}</span>
                                <span className="text-indigo-400 mx-1">—</span>
                                <span className="text-indigo-600">{pg.nama_program}</span>
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {Array.from(months).map(b => (
                                    <span key={b} className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-md">{b.slice(0,3)}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null
                        })
                      }
                    </div>
                  </div>

                  {/* Target Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">Tahun Target <span className="text-rose-400">*</span></label>
                      <select
                        value={bdTargetYear}
                        onChange={e => setBdTargetYear(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
                      >
                        {TAHUN_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-wider text-slate-500">Bulan Tujuan (Opsional)</label>
                       <Popover>
                        <PopoverTrigger asChild>
                          <button className={`w-full h-11 px-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${
                            bdTargetMonths.size > 0 ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {bdTargetMonths.size > 0 ? `${bdTargetMonths.size} Bulan` : 'Gunakan Bulan Sumber'}
                            </div>
                            <Plus className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 rounded-2xl border-slate-100 shadow-xl" align="end">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Pilih Bulan Tujuan</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map(b => {
                              const isOccupied = bdOccupiedMonths.has(b);
                              return (
                                <button key={b} 
                                  disabled={isOccupied}
                                  onClick={() => setBdTargetMonths(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n })}
                                  className={`h-8 rounded-lg text-xs font-bold transition-all border ${
                                    isOccupied ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
                                    bdTargetMonths.has(b) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                                  }`}>
                                  {b.slice(0,3)}
                                </button>
                              )
                            })}
                          </div>
                          {bdOccupiedMonths.size > 0 && (
                            <div className="mt-2 text-[9px] text-amber-600 bg-amber-50 p-1.5 rounded-lg border border-amber-100 italic">
                              Beberapa bulan di-disable karena sudah ada data di target.
                            </div>
                          )}
                          {bdTargetMonths.size > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              {/* ... */}
                              <button onClick={() => setBdTargetMonths(new Set())} className="w-full text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg py-1.5">Reset</button>
                            </div>
                          )}
                        </PopoverContent>
                       </Popover>
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Mode Duplikasi</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setBdMode('basic')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          bdMode === 'basic' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`text-sm font-black mb-1 ${ bdMode === 'basic' ? 'text-indigo-700' : 'text-slate-700' }`}>Basic</div>
                        <div className="text-xs text-slate-400">Duplikasi ke desa yang sama, tahun baru</div>
                      </button>
                      <button
                        onClick={() => setBdMode('advanced')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${
                          bdMode === 'advanced' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`text-sm font-black mb-1 ${ bdMode === 'advanced' ? 'text-indigo-700' : 'text-slate-700' }`}>Advanced</div>
                        <div className="text-xs text-slate-400">Pilih desa tujuan berbeda</div>
                      </button>
                    </div>
                  </div>

                  {/* Advanced: Desa target */}
                  {bdMode === 'advanced' && (
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Desa Tujuan <span className="text-rose-400">*</span>
                        {bdTargetDesaIds.size > 0 && <span className="ml-2 text-indigo-600">({bdTargetDesaIds.size} dipilih)</span>}
                      </label>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                          {desaOptions.map(d => (
                            <button key={d.id}
                              onClick={() => setBdTargetDesaIds(prev => { const n = new Set(prev); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n })}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                                bdTargetDesaIds.has(d.id) ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                              }`}>
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                bdTargetDesaIds.has(d.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                              }`}>{bdTargetDesaIds.has(d.id) && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}</div>
                              <span className="text-left">{d.nama}</span>
                              {d.relawan_nama && <span className="ml-auto text-xs text-slate-400">({d.relawan_nama})</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editable Preview Table */}
                  {bdPreviewRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-500">Preview Anggaran yang Akan Dibuat</label>
                        <span className="text-[10px] text-slate-400 italic">Data bisa diedit sebelum disimpan</span>
                      </div>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_80px_110px_110px_60px] gap-0 bg-slate-50 border-b border-slate-100 px-3 py-2">
                          <span className="text-[10px] font-black uppercase text-slate-400">Program / Bulan</span>
                          <span className="text-[10px] font-black uppercase text-slate-400 text-right">Ajuan RI</span>
                          <span className="text-[10px] font-black uppercase text-slate-400 text-right">Disetujui</span>
                          <span className="text-[10px] font-black uppercase text-slate-400 text-right">Dicairkan</span>
                          <span className="text-[10px] font-black uppercase text-slate-400 text-center">DBF</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                          {bdPreviewRows.map((row, idx) => (
                            <div key={row.key} className="grid grid-cols-[1fr_80px_110px_110px_60px] gap-0 px-3 py-2 items-center hover:bg-slate-50/50 transition-colors">
                              <div>
                                <div className="text-xs font-bold text-slate-700 truncate">{row.desaName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {row.sourceMonth !== row.targetMonth && (
                                    <span className="text-[10px] text-slate-400 line-through">{row.sourceMonth.slice(0,3)}</span>
                                  )}
                                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md">{row.targetMonth.slice(0,3)} {bdTargetYear}</span>
                                </div>
                              </div>
                              <input
                                type="number"
                                value={row.ajuan_ri}
                                onChange={e => setBdPreviewRows(prev => prev.map((r, i) => i === idx ? {...r, ajuan_ri: Number(e.target.value)} : r))}
                                className="w-full text-xs font-bold text-right bg-transparent border-b border-slate-200 focus:border-indigo-400 focus:outline-none py-1 text-slate-700"
                              />
                              <input
                                type="number"
                                value={row.anggaran_disetujui}
                                onChange={e => setBdPreviewRows(prev => prev.map((r, i) => i === idx ? {...r, anggaran_disetujui: Number(e.target.value)} : r))}
                                className="w-full text-xs font-bold text-right bg-transparent border-b border-slate-200 focus:border-indigo-400 focus:outline-none py-1 text-slate-700"
                              />
                              <input
                                type="number"
                                value={row.anggaran_dicairkan}
                                onChange={e => setBdPreviewRows(prev => prev.map((r, i) => i === idx ? {...r, anggaran_dicairkan: Number(e.target.value)} : r))}
                                className="w-full text-xs font-bold text-right bg-transparent border-b border-slate-200 focus:border-indigo-400 focus:outline-none py-1 text-slate-700"
                              />
                              <div className="flex justify-center">
                                <button
                                  onClick={() => setBdPreviewRows(prev => prev.map((r, i) => i === idx ? {...r, is_dbf: !r.is_dbf} : r))}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${row.is_dbf ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}
                                >
                                  {row.is_dbf && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className={`rounded-2xl p-4 border ${
                    totalWillCreate > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Estimasi Hasil</p>
                    <p className="text-2xl font-black text-emerald-600">{bdPreviewRows.length} <span className="text-sm font-bold text-emerald-500">baris anggaran (DRAFT)</span></p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedProgramCount} sumber × {bdMode === 'advanced' && bdTargetDesaIds.size > 0 ? bdTargetDesaIds.size : 1} desa tujuan
                      {bdTargetMonths.size > 0 ? ` × ${bdTargetMonths.size} bulan target` : ''} → Tahun {bdTargetYear}
                    </p>
                  </div>
                </div>

                {/* Footer Step 2 */}
                <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
                  <Button variant="ghost" className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100 gap-1" onClick={() => setBdStep(1)}>
                    <ChevronLeft className="w-4 h-4" />Kembali
                  </Button>
                  <Button
                    className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2 px-6 shadow-lg shadow-indigo-500/20"
                    disabled={isBulkDuplicating || (bdMode === 'advanced' && bdTargetDesaIds.size === 0)}
                    onClick={executeBulkDuplicate}
                  >
                    {isBulkDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    {isBulkDuplicating ? 'Membuat...' : `Duplikat ${totalWillCreate} Program`}
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
