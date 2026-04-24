'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Edit, Save, Check, ChevronsUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

import {
  formCategoryWithFieldsSchema,
  type FormCategoryWithFieldsInput,
} from '@/lib/validations/form-builder'
import {
  createFormCategory,
  deleteFormCategory,
  getFormCategoryById,
  updateFormCategory,
} from '@/lib/actions/form-builder'

type FormBuilderClientProps = {
  initialCategories: any[]
  kategoriOptions: any[]
  programOptions: any[]
}

export function FormBuilderClient({
  initialCategories,
  kategoriOptions,
  programOptions,
}: FormBuilderClientProps) {
  const [categories, setCategories] = useState<any[]>(initialCategories || [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Search state for table
  const [searchQuery, setSearchQuery] = useState('')

  // Combobox states
  const [openKategori, setOpenKategori] = useState(false)
  const [openProgram, setOpenProgram] = useState(false)

  const defaultValues: FormCategoryWithFieldsInput = useMemo(
    () => ({
      name: '',
      description: undefined,
      fields: [],
    }),
    [],
  )

  const form = useForm<FormCategoryWithFieldsInput>({
    resolver: zodResolver(formCategoryWithFieldsSchema),
    defaultValues,
  })

  const { control, handleSubmit, reset, watch, setValue } = form

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'fields',
  })

  const onSubmit = (values: FormCategoryWithFieldsInput) => {
    startTransition(async () => {
      const payload: FormCategoryWithFieldsInput = {
        ...values,
        fields: values.fields.map((field, index) => ({
          ...field,
          order_index: index,
        })),
      }

      const action = editingId
        ? updateFormCategory(editingId, payload)
        : createFormCategory(payload)

      const result = await action

      if (result.success) {
        toast.success(
          editingId ? 'Kategori form berhasil diupdate' : 'Kategori form berhasil dibuat',
        )
        reset(defaultValues)
        setEditingId(null)

        try {
          const res = await fetch('/api/form-builder/categories')
          if (!res.ok) {
            if (res.status === 401) {
              toast.error('Anda tidak memiliki akses untuk melihat kategori form')
              return
            }
            toast.error('Gagal memuat ulang daftar kategori form')
            return
          }
          const json = await res.json()
          if (json?.success) {
            setCategories(json.data || [])
          } else {
            toast.error(json?.error || 'Gagal memuat ulang daftar kategori form')
          }
        } catch (e) {
          console.error('Error refreshing categories:', e)
          toast.error('Terjadi kesalahan jaringan saat memuat ulang kategori form')
        }
      } else {
        toast.error(result.error || 'Terjadi kesalahan saat menyimpan kategori form')
      }
    })
  }

  const handleEdit = (id: number) => {
    startTransition(async () => {
      try {
        const data = await getFormCategoryById(id)
        if (!data) {
          toast.error('Kategori form tidak ditemukan')
          return
        }

        const { category, fields } = data

        reset({
          name: category.name || '',
          description: category.description || undefined,
          fields: (fields || []).map((f: any) => ({
            id: Number(f.id),
            category_id: Number(f.category_id),
            field_name: String(f.field_name),
            field_label: String(f.field_label),
            field_type: String(f.field_type) as any,
            field_options: Array.isArray(f.field_options) ? f.field_options : [],
            is_required: Boolean(f.is_required),
            order_index: Number(f.order_index ?? 0),
          })),
        })

        setEditingId(id)
      } catch (error) {
        console.error(error)
        toast.error('Gagal mengambil detail kategori form')
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('Yakin ingin menghapus kategori form ini?')) return

    startTransition(async () => {
      const result = await deleteFormCategory(id)
      if (result.success) {
        toast.success('Kategori form berhasil dihapus')
        setCategories((prev) => prev.filter((c) => c.id != id))
      } else {
        toast.error(result.error || 'Terjadi kesalahan saat menghapus kategori form')
      }
    })
  }

  const addField = () => {
    append({
      field_name: '',
      field_label: '',
      field_type: 'text',
      field_options: [],
      is_required: false,
      order_index: fields.length,
    } as any)
  }

  const watchFields = watch('fields')
  const watchName = watch('name')
  const watchDescription = watch('description')

  const selectedKategoriId = useMemo(() => {
    if (!watchName) return undefined
    const found = kategoriOptions.find((k: any) => k.nama_kategori === watchName)
    return found ? String(found.id) : undefined
  }, [watchName, kategoriOptions])

  const selectedProgramId = useMemo(() => {
    if (!watchDescription) return undefined
    const found = programOptions.find((p: any) => p.nama_program === watchDescription)
    return found ? String(found.id) : undefined
  }, [watchDescription, programOptions])

  const filteredProgramOptions = useMemo(() => {
    if (!selectedKategoriId) return []
    return programOptions.filter(
      (p: any) => String(p.kategori_id) === selectedKategoriId,
    )
  }, [programOptions, selectedKategoriId])

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories
    const q = searchQuery.toLowerCase()
    return categories.filter(c => 
      c.name?.toLowerCase().includes(q) || 
      c.description?.toLowerCase().includes(q)
    )
  }, [categories, searchQuery])

  const isEditing = editingId !== null

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* KOLOM KIRI: EDITOR */}
        <Card className="shadow-lg border-slate-200 xl:sticky xl:top-4">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xl text-slate-800">
              {isEditing ? 'Edit Kategori Form' : 'Tambah Kategori Form'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Kategori Program *</Label>
                  <Popover open={openKategori} onOpenChange={setOpenKategori}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openKategori}
                        className={cn("w-full justify-between font-normal", !watchName && "text-slate-500")}
                      >
                        {watchName || "Pilih Kategori..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari kategori..." />
                        <CommandList>
                          <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {kategoriOptions.map((k: any) => (
                              <CommandItem
                                key={k.id}
                                value={k.nama_kategori}
                                onSelect={(currentValue) => {
                                  setValue('name', currentValue, { shouldValidate: true })
                                  setValue('description', '', { shouldValidate: true }) // reset program
                                  setOpenKategori(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    watchName === k.nama_kategori ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {k.nama_kategori}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.name && (
                    <p className="text-xs text-rose-500 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Program *</Label>
                  <Popover open={openProgram} onOpenChange={setOpenProgram}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openProgram}
                        disabled={!selectedKategoriId}
                        className={cn("w-full justify-between font-normal", !watchDescription && "text-slate-500")}
                      >
                        {watchDescription || "Pilih Program..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari program..." />
                        <CommandList>
                          <CommandEmpty>Program tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {filteredProgramOptions.map((p: any) => (
                              <CommandItem
                                key={p.id}
                                value={p.nama_program}
                                onSelect={(currentValue) => {
                                  setValue('description', currentValue, { shouldValidate: true })
                                  setOpenProgram(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    watchDescription === p.nama_program ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {p.nama_program}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.description && (
                    <p className="text-xs text-rose-500 mt-1">
                      {form.formState.errors.description.message as string}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Custom Fields</h3>
                    <p className="text-xs text-slate-500">Tambahkan input khusus untuk formulir ini.</p>
                  </div>
                  <Button
                    type="button"
                    onClick={addField}
                    className="bg-[#7a1200] hover:bg-[#5a0d00] shadow-md shadow-red-900/20"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Field
                  </Button>
                </div>

                {form.formState.errors.fields && !Array.isArray(form.formState.errors.fields) && (
                  <p className="text-xs text-rose-500 font-medium">
                    {form.formState.errors.fields.message as string}
                  </p>
                )}

                {fields.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-sm text-slate-500 font-medium">
                      Belum ada custom field.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card key={field.id} className="border-slate-200 shadow-sm transition-all hover:border-[#7a1200]/30 relative overflow-visible group">
                        
                        {/* DND Actions */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button 
                            type="button"
                            onClick={() => swap(index, index - 1)}
                            disabled={index === 0}
                            className="bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => swap(index, index + 1)}
                            disabled={index === fields.length - 1}
                            className="bg-white border border-slate-200 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:border-slate-400 disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <CardContent className="p-5">
                          <div className="flex flex-col md:flex-row md:items-start gap-5">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                              <div className="space-y-2 md:col-span-7">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Label Field *</Label>
                                <Input
                                  {...form.register(`fields.${index}.field_label` as const, {
                                    onChange: (e) => {
                                      const val = e.target.value
                                      const slug = val
                                        .toLowerCase()
                                        .trim()
                                        .replace(/\s+/g, '_')
                                        .replace(/[^a-z0-9_]/g, '')
                                      setValue(`fields.${index}.field_name`, slug, {
                                        shouldValidate: true,
                                      })
                                    },
                                  })}
                                  placeholder="Contoh: Jumlah Penerima Manfaat"
                                  className="font-medium"
                                />
                                <input
                                  type="hidden"
                                  {...form.register(`fields.${index}.field_name` as const)}
                                />
                                {form.formState.errors.fields?.[index]?.field_label && (
                                  <p className="text-xs text-rose-500">
                                    {form.formState.errors.fields?.[index]?.field_label?.message as string}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-2 md:col-span-5">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe Field *</Label>
                                <Select
                                  onValueChange={(value) => setValue(`fields.${index}.field_type`, value as any)}
                                  value={watch(`fields.${index}.field_type`) as string}
                                >
                                  <SelectTrigger className="font-medium bg-slate-50">
                                    <SelectValue placeholder="Pilih tipe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Teks Pendek</SelectItem>
                                    <SelectItem value="textarea">Teks Panjang</SelectItem>
                                    <SelectItem value="number">Angka</SelectItem>
                                    <SelectItem value="date">Tanggal</SelectItem>
                                    <SelectItem value="url">URL Tautan</SelectItem>
                                    <SelectItem value="radio">Radio Pilihan Tunggal</SelectItem>
                                    <SelectItem value="checkbox">Checkbox Pilihan Ganda</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="flex md:flex-col items-center justify-between gap-4 md:w-auto h-full pt-6">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`required-${index}`}
                                  checked={watch(`fields.${index}.is_required`) as boolean}
                                  onCheckedChange={(checked) =>
                                    setValue(`fields.${index}.is_required`, Boolean(checked))
                                  }
                                />
                                <Label htmlFor={`required-${index}`} className="text-sm font-medium cursor-pointer">
                                  Wajib
                                </Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Field Options Bulk Input */}
                          {(watch(`fields.${index}.field_type`) === 'radio' || watch(`fields.${index}.field_type`) === 'checkbox') && (
                            <div className="mt-4 p-4 bg-slate-50/80 border border-slate-200 rounded-lg">
                              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Opsi Pilihan (Bulk Input)</Label>
                              <Textarea 
                                placeholder="Ketik opsi pilihan, pisahkan dengan baris baru (enter)"
                                className="min-h-[80px] text-sm bg-white"
                                defaultValue={(watch(`fields.${index}.field_options`) || []).join('\n')}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const options = raw.split(/\n/).map(o => o.trim()).filter(o => o !== '');
                                  setValue(`fields.${index}.field_options`, options, { shouldValidate: true })
                                }}
                              />
                              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                Contoh tiap baris: <br />
                                Sangat Baik<br />
                                Baik<br />
                                Cukup
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {Object.keys(form.formState.errors).length > 0 && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
                  <p className="text-sm font-bold text-red-700 mb-1">Periksa kembali formulir Anda:</p>
                  <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                    {form.formState.errors.name && <li>Kategori Program: {form.formState.errors.name.message}</li>}
                    {form.formState.errors.description && <li>Program: {form.formState.errors.description.message as string}</li>}
                    {form.formState.errors.fields && Array.isArray(form.formState.errors.fields) && form.formState.errors.fields.map((err: any, idx) => (
                      err && <li key={idx}>Field ke-{idx + 1}: Periksa label dan tipe field.</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="submit"
                  className="bg-[#7a1200] hover:bg-[#5a0d00] flex-1 md:flex-none shadow-md shadow-red-900/20"
                  disabled={isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Simpan Perubahan' : 'Simpan Kategori Form'}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset(defaultValues)
                      setEditingId(null)
                    }}
                    disabled={isPending}
                    className="flex-1 md:flex-none"
                  >
                    Batal Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* KOLOM KANAN: LIVE PREVIEW */}
        <div className="space-y-6 xl:sticky xl:top-4">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl text-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs font-mono text-slate-400 font-medium tracking-wider uppercase">Live Preview</span>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-inner text-slate-800">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-[#7a1200]">
                  Form Laporan {watchName || '[Kategori Program]'}
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  {watchDescription || '[Pilih Program]'}
                </p>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Default Fields Preview (Mock) */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Field Default Sistem</h4>
                  <div className="grid grid-cols-2 gap-4 opacity-70 pointer-events-none">
                    <div className="space-y-1"><div className="h-4 w-20 bg-slate-200 rounded" /><div className="h-9 w-full bg-slate-100 rounded" /></div>
                    <div className="space-y-1"><div className="h-4 w-24 bg-slate-200 rounded" /><div className="h-9 w-full bg-slate-100 rounded" /></div>
                    <div className="space-y-1"><div className="h-4 w-28 bg-slate-200 rounded" /><div className="h-9 w-full bg-slate-100 rounded" /></div>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium mt-3 text-center">+ 15 field sistem lainnya</p>
                </div>

                {/* Custom Fields Preview */}
                <div className="space-y-5 relative">
                  {watchFields.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm italic">
                      Custom fields akan muncul di sini...
                    </div>
                  ) : (
                    watchFields.map((f, i) => (
                      <div key={i} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Label className="font-semibold text-slate-700 flex items-center gap-1 text-sm">
                          {f.field_label || `Custom Field ${i + 1}`}
                          {f.is_required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {f.field_type === 'text' && <Input placeholder="Input teks pendek..." disabled className="bg-slate-50" />}
                        {f.field_type === 'number' && <Input type="number" placeholder="Input angka..." disabled className="bg-slate-50" />}
                        {f.field_type === 'date' && <Input type="date" disabled className="bg-slate-50" />}
                        {f.field_type === 'url' && <Input type="url" placeholder="https://..." disabled className="bg-slate-50" />}
                        {f.field_type === 'textarea' && <Textarea placeholder="Input teks panjang..." disabled className="bg-slate-50 resize-none h-20" />}
                        
                        {f.field_type === 'radio' && (
                          <div className="space-y-2 mt-2">
                            {(!f.field_options || f.field_options.length === 0) ? (
                              <p className="text-xs text-slate-400 italic">Belum ada opsi didefinisikan.</p>
                            ) : (
                              f.field_options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-slate-100" />
                                  <span className="text-sm text-slate-600">{opt}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {f.field_type === 'checkbox' && (
                          <div className="space-y-2 mt-2">
                            {(!f.field_options || f.field_options.length === 0) ? (
                              <p className="text-xs text-slate-400 italic">Belum ada opsi didefinisikan.</p>
                            ) : (
                              f.field_options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded border-2 border-slate-300 bg-slate-100" />
                                  <span className="text-sm text-slate-600">{opt}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL DAFTAR KATEGORI FORM */}
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl text-slate-800">Daftar Kategori Form</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari kategori atau program..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              {searchQuery ? 'Pencarian tidak menemukan hasil.' : 'Belum ada kategori form.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 px-6 py-4">Nama Kategori</TableHead>
                    <TableHead className="font-bold text-slate-700">Program</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Custom Fields</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-[#7a1200] px-6">{category.name}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-600 font-medium">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {category.fields_count ?? 0} field
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 shadow-sm hover:bg-slate-100"
                            onClick={() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              handleEdit(Number(category.id));
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 shadow-sm shadow-red-900/10"
                            onClick={() => handleDelete(Number(category.id))}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
