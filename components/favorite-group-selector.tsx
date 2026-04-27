'use client'

import React, { useState, useEffect } from 'react'
import { Star, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface FavoriteGroupSelectorProps {
  moduleName: string;
  currentGroupBys: string[];
  onApplyFavorite: (groups: string[]) => void;
}

export function FavoriteGroupSelector({ moduleName, currentGroupBys, onApplyFavorite }: FavoriteGroupSelectorProps) {
  const [favorites, setFavorites] = useState<{name: string, groups: string[]}[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const storageKey = `app_group_favorites_${moduleName}`

  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {}
    }
  }, [storageKey])

  const saveFavorite = () => {
    if (!saveName.trim()) return
    if (currentGroupBys.length === 0) {
      toast.error('Pilih setidaknya 1 group by untuk disimpan')
      return
    }

    const newFavs = [...favorites, { name: saveName.trim(), groups: [...currentGroupBys] }]
    setFavorites(newFavs)
    localStorage.setItem(storageKey, JSON.stringify(newFavs))
    setSaveName('')
    setIsSaving(false)
    toast.success('Kombinasi berhasil disimpan')
  }

  const deleteFavorite = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    const newFavs = favorites.filter((_, i) => i !== idx)
    setFavorites(newFavs)
    localStorage.setItem(storageKey, JSON.stringify(newFavs))
  }

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) {
        setIsSaving(false)
        setSaveName('')
      }
    }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-[42px] px-3 rounded-xl border-slate-200 text-slate-600 font-bold gap-2 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 shrink-0">
          <Star className="w-4 h-4 text-yellow-500" />
          Favorit Grouping
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 rounded-xl shadow-lg border-slate-200" align="end">
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          {isSaving ? (
            <div className="space-y-2">
              <Input 
                placeholder="Nama kombinasi..." 
                value={saveName} 
                onChange={e => setSaveName(e.target.value)}
                className="h-8 text-xs bg-white"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') saveFavorite() }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveFavorite} className="h-8 flex-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-bold shadow-sm">Simpan</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsSaving(false)} className="h-8 flex-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/50">Batal</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSaving(true)} 
              className="w-full h-8 text-xs font-bold border-dashed border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
              disabled={currentGroupBys.length === 0}
            >
              <Plus className="w-3 h-3 mr-1" /> Simpan Grouping Saat Ini
            </Button>
          )}
        </div>
        <div className="p-2 max-h-60 overflow-y-auto">
          {favorites.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 font-medium">Belum ada favorit tersimpan</div>
          ) : (
            <div className="space-y-1">
              {favorites.map((fav, idx) => (
                <div key={idx} className="flex items-center gap-1 group/item">
                  <button 
                    onClick={() => {
                      onApplyFavorite(fav.groups)
                      setIsOpen(false)
                    }}
                    className="flex-1 text-left px-3 py-2 rounded-lg hover:bg-slate-100/80 text-xs transition-colors"
                  >
                    <div className="font-bold text-slate-700">{fav.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                      {fav.groups.join(' > ')}
                    </div>
                  </button>
                  <button 
                    onClick={(e) => deleteFavorite(e, idx)}
                    className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all shrink-0"
                    title="Hapus favorit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
