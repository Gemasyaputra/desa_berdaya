'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Edit, Save } from 'lucide-react'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  const [selectedKategoriId, setSelectedKategoriId] = useState<string | undefined>(undefined)
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined)

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

  const { fields, append, remove } = useFieldArray({
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
        setSelectedKategoriId(undefined)
        setSelectedProgramId(undefined)

        // Refresh list from server for consistency
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

        // coba mapping kembali ke select berdasarkan nama
        const foundKategori = kategoriOptions.find(
          (k: any) => (k as any).nama_kategori === category.name,
        )
        if (foundKategori) {
          setSelectedKategoriId(String((foundKategori as any).id))
        } else {
          setSelectedKategoriId(undefined)
        }

        const foundProgram = programOptions.find(
          (p: any) => (p as any).nama_program === category.description,
        )
        if (foundProgram) {
          setSelectedProgramId(String((foundProgram as any).id))
        } else {
          setSelectedProgramId(undefined)
        }

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


  // Sinkronkan pilihan awal select jika datang dari data existing (name/description sudah terisi)
  useEffect(() => {
    if (!selectedKategoriId && watchName) {
      const found = kategoriOptions.find(
        (k: any) => (k as any).nama_kategori === watchName,
      )
      if (found) {
        setSelectedKategoriId(String((found as any).id))
      }
    }
  }, [selectedKategoriId, watchName, kategoriOptions])

  const filteredProgramOptions = useMemo(() => {
    if (!selectedKategoriId) return []
    return programOptions.filter(
      (p: any) => String((p as any).kategori_id) === selectedKategoriId,
    )
  }, [programOptions, selectedKategoriId])

  const isEditing = editingId !== null

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Edit Kategori Form' : 'Tambah Kategori Form'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori Program *</Label>
                <Select
                  value={selectedKategoriId}
                  onValueChange={(value) => {
                    setSelectedKategoriId(value)
                    setSelectedProgramId(undefined)
                    setValue('description', '', { shouldValidate: true })
                    const selected = kategoriOptions.find(
                      (k: any) => String((k as any).id) === value,
                    )
                    const nama = selected ? (selected as any).nama_kategori : ''
                    setValue('name', nama, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kategori Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriOptions.map((k: any) => (
                      <SelectItem key={(k as any).id} value={String((k as any).id)}>
                        {(k as any).nama_kategori}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Program *</Label>
                <Select
                  value={selectedProgramId}
                  onValueChange={(value) => {
                    setSelectedProgramId(value)
                    const selected = programOptions.find(
                      (p: any) => String((p as any).id) === value,
                    )
                    const nama = selected ? (selected as any).nama_program : ''
                    setValue('description', nama, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProgramOptions.map((p: any) => (
                      <SelectItem key={(p as any).id} value={String((p as any).id)}>
                        {(p as any).nama_program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.description && (
                  <p className="text-xs text-red-600 mt-1">
                    {form.formState.errors.description.message as string}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Field Wajib (Default)</h3>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
                  {[
                    'Nama Desa', 'Tanggal Aktifitas', 'Nama Aktifitas',
                    'Cabang', 'Korwil', 'Monev',
                    'Nama Relawan', 'Kategori Program', 'Program',
                    'Sasaran Program', 'Periode Laporan', 'Lokasi Pelaksanaan',
                    'Jumlah PM Laki-laki', 'Jumlah PM Perempuan', 'Jumlah PM',
                    'Jumlah Anggota Kelompok Perempuan', 'Jumlah Anggota Kelompok Laki-laki',
                    'Terdokumentasi?'
                  ].map((field) => (
                    <div key={field} className="flex items-center gap-2 text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      {field}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-4 italic">
                  * Field di atas adalah field standar yang akan muncul di setiap formulir dan tidak dapat diubah.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Custom Field</h3>
                <Button
                  type="button"
                  onClick={addField}
                  className="bg-[#7a1200] hover:bg-[#5a0d00]"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Field
                </Button>
              </div>

              {form.formState.errors.fields && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.fields.message as string}
                </p>
              )}

              {fields.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada custom field. Klik &quot;Tambah Field&quot; untuk mulai.
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-slate-200">
                      <CardContent className="pt-4">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label>Label Field *</Label>
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
                                placeholder="Contoh: Jumlah Peserta"
                              />
                              <input
                                type="hidden"
                                {...form.register(`fields.${index}.field_name` as const)}
                              />
                              {form.formState.errors.fields?.[index]?.field_label && (
                                <p className="text-xs text-red-600 mt-1">
                                  {
                                    form.formState.errors.fields?.[index]?.field_label
                                      ?.message as string
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Tipe Field *</Label>
                              <Select
                                onValueChange={(value) =>
                                  setValue(
                                    `fields.${index}.field_type`,
                                    value as any,
                                  )
                                }
                                value={watch(
                                  `fields.${index}.field_type`,
                                ) as string}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="url">URL</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                  <SelectItem value="radio">Radio Button</SelectItem>
                                  <SelectItem value="checkbox">Checkbox</SelectItem>
                                </SelectContent>
                              </Select>
                              {form.formState.errors.fields?.[index]?.field_type && (
                                <p className="text-xs text-red-600 mt-1">
                                  {
                                    form.formState.errors.fields?.[index]?.field_type
                                      ?.message as string
                                  }
                                </p>
                              )}
                            </div>
                            <div className="space-y-2 flex flex-col justify-between">
                              <div className="flex items-center gap-2 mt-6">
                                <Checkbox
                                  id={`required-${index}`}
                                  checked={watch(
                                    `fields.${index}.is_required`,
                                  ) as boolean}
                                  onCheckedChange={(checked) =>
                                    setValue(
                                      `fields.${index}.is_required`,
                                      Boolean(checked),
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`required-${index}`}
                                  className="text-sm font-normal"
                                >
                                  Wajib diisi
                                </Label>
                              </div>
                              <p className="text-[10px] text-slate-500">
                                Urutan field mengikuti posisi pada daftar ini.
                              </p>
                            </div>
                          </div>
                          <div className="flex md:flex-col gap-2 justify-end md:justify-start">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Field Options for Radio/Checkbox */}
                        {(watch(`fields.${index}.field_type`) === 'radio' || watch(`fields.${index}.field_type`) === 'checkbox') && (
                          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">Opsi Pilihan (Choices)</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentOptions = watch(`fields.${index}.field_options`) || []
                                  setValue(`fields.${index}.field_options`, [...currentOptions, ''], { shouldValidate: true })
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Tambah Opsi
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {(watch(`fields.${index}.field_options`) || []).map((option: string, optIndex: number) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const currentOptions = [...(watch(`fields.${index}.field_options`) || [])]
                                      currentOptions[optIndex] = e.target.value
                                      setValue(`fields.${index}.field_options`, currentOptions, { shouldValidate: true })
                                    }}
                                    placeholder={`Opsi ${optIndex + 1}`}
                                    className="h-9"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      const currentOptions = [...(watch(`fields.${index}.field_options`) || [])]
                                      currentOptions.splice(optIndex, 1)
                                      setValue(`fields.${index}.field_options`, currentOptions, { shouldValidate: true })
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              {(watch(`fields.${index}.field_options`) || []).length === 0 && (
                                <p className="text-xs text-slate-400 italic col-span-full">
                                  Klik &quot;Tambah Opsi&quot; untuk menambahkan pilihan.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-600 mb-1">Terjadi kesalahan pada formulir:</p>
                <ul className="list-disc list-inside text-xs text-red-500 space-y-1">
                  {form.formState.errors.name && <li>Kategori Program: {form.formState.errors.name.message}</li>}
                  {form.formState.errors.description && <li>Program: {form.formState.errors.description.message as string}</li>}
                  {form.formState.errors.fields && (
                    <>
                      {Array.isArray(form.formState.errors.fields) ? (
                        form.formState.errors.fields.map((err: any, idx) => (
                          err && <li key={idx}>Field #{idx + 1}: {err.field_label?.message || err.field_name?.message || err.field_type?.message || 'Data tidak valid'}</li>
                        ))
                      ) : (
                        <li>Fields: {(form.formState.errors.fields as any).message}</li>
                      )}
                    </>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-[#7a1200] hover:bg-[#5a0d00]"
                disabled={isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Simpan Perubahan' : 'Simpan Kategori'}
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
                >
                  Batal Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori Form</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada kategori form.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Jumlah Field</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>{category.fields_count ?? 0}</TableCell>
                    <TableCell>
                      {category.created_at
                        ? new Date(category.created_at).toLocaleDateString('id-ID')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(Number(category.id))}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(Number(category.id))}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
