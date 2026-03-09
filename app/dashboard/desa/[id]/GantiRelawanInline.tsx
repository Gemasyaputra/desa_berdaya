'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeftRight, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { getRelawanList, changeDesaRelawan, type RelawanRow } from '../../manajemen-tim/actions'

export function GantiRelawanInline({
  desaId,
  currentRelawanId,
  currentRelawanNama,
}: {
  desaId: number
  currentRelawanId: number | null
  currentRelawanNama?: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [relawanList, setRelawanList] = useState<RelawanRow[]>([])
  const [selected, setSelected] = useState(currentRelawanId ? String(currentRelawanId) : '__none')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEdit = async () => {
    setLoading(true)
    const data = await getRelawanList()
    setRelawanList(data)
    setLoading(false)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const newId = selected === '__none' ? null : Number(selected)
    const res = await changeDesaRelawan(desaId, newId)
    if (res.success) {
      toast.success('Relawan berhasil diganti')
      setTimeout(() => window.location.reload(), 600)
    } else {
      toast.error(res.error || 'Gagal mengganti relawan')
    }
    setSaving(false)
  }

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        disabled={loading}
        className="mt-3 w-full gap-1.5 text-xs border-dashed border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
      >
        {loading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <ArrowLeftRight className="w-3.5 h-3.5" />
        }
        Ganti Relawan
      </Button>
    )
  }

  return (
    <div className="mt-3 border border-purple-100 bg-purple-50/50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-purple-700">Ganti Relawan Pendamping</p>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="bg-white text-sm border-slate-200">
          <SelectValue>
            {selected === '__none'
              ? <span className="text-slate-400 italic">Tidak ada relawan</span>
              : (relawanList.find((r) => String(r.id) === selected)?.nama ?? currentRelawanNama ?? 'Pilih relawan...')
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">
            <span className="text-slate-400 italic">— Tidak ada relawan —</span>
          </SelectItem>
          {relawanList.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              <span>{r.nama}</span>
              {r.korwil_nama && (
                <span className="text-slate-400 text-xs ml-1">({r.korwil_nama})</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#7a1200' }}
          className="text-white gap-1 flex-1 text-xs"
        >
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Check className="w-3.5 h-3.5" />
          }
          Simpan
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(false)}
          className="flex-1 text-xs gap-1"
        >
          <X className="w-3.5 h-3.5" /> Batal
        </Button>
      </div>
    </div>
  )
}
