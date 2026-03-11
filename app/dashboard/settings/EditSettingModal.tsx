'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updateSettingAdmin } from './actions'
import { Loader2, Edit3, X, Save, UploadCloud, ImageIcon } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { Switch } from '@/components/ui/switch'

export default function EditSettingModal({
  itemKey,
  initialValue,
  isImage,
  isColor,
  labelTitle
}: {
  itemKey: string
  initialValue: string
  isImage?: boolean
  isColor?: boolean
  labelTitle?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  
  const isBoolean = initialValue.trim() === 'true' || initialValue.trim() === 'false' || !!labelTitle?.includes('(true/false)') || itemKey.endsWith('_enabled')

  const handleSave = async () => {
    try {
      setLoading(true)
      await updateSettingAdmin(itemKey, value)
      setIsOpen(false)
      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      setValue(newBlob.url)
    } catch (error: any) {
      alert('Gagal mengunggah gambar: ' + error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-[#7a1200] hover:bg-red-50 hover:text-[#5a0d00]"
        onClick={() => setIsOpen(true)}
      >
        <Edit3 className="w-4 h-4 mr-1.5" /> Edit
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Edit Pengaturan</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-2">
                  {labelTitle || 'Key Konfigurasi'}
                </label>
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono text-xs inline-block">
                  {itemKey}
                </div>
              </div>

              {isImage && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pratinjau Gambar / Ganti Berkas
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-32 h-32 rounded-xl border border-slate-200 bg-[#f8fafc] shadow-inner flex items-center justify-center overflow-hidden shrink-0 relative custom-checkerboard">
                      {value ? (
                        <img 
                          src={value} 
                          alt="Preview Modal" 
                          className="max-w-full max-h-full object-contain p-2"
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-slate-400 text-center px-2">Preview Gagal</span>' }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Anda dapat menempel <i>(paste)</i> URL gambar secara mandiri di bawah ini, atau unggah gambar baru secara instan langsung ke penyimpanan Cloud kami (Maksimal 4,5MB).
                      </p>
                      <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleUpload}
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploading || loading}
                        variant="secondary"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 w-full sm:w-auto"
                      >
                        {uploading ? (
                           <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
                        ) : (
                           <><UploadCloud className="w-4 h-4 mr-2" /> Unggah Berkas Baru</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isImage ? 'Alamat URL Gambar' : isColor ? 'Kode Warna Hex/RGB' : 'Value / Nilai'}
                </label>
                
                {isColor && (
                  <div className="flex items-center gap-4 mb-3">
                    <input 
                      type="color" 
                      className="w-12 h-12 p-1 rounded cursor-pointer border-slate-200 border"
                      value={value.startsWith('#') ? value : '#000000'}
                      onChange={(e) => setValue(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">
                      Anda bisa menggeser palet di sebelah kiri atau tetap mengetik manual kombinasi Hex, RGB, maupun RGBA Gradien di dalam kotak di bawah ini.
                    </span>
                  </div>
                )}

                {isBoolean ? (
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">
                        {value === 'true' ? 'Aktif (True)' : 'Nonaktif (False)'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Klik toggle di samping untuk mengubah status konfigurasi.
                      </div>
                    </div>
                    <Switch 
                      checked={value.trim() === 'true'}
                      onCheckedChange={(checked: boolean) => setValue(checked ? 'true' : 'false')}
                      disabled={loading}
                    />
                  </div>
                ) : (
                  <textarea 
                    rows={isImage || isColor ? 2 : 6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200] font-mono text-sm leading-relaxed"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={isImage ? "https://..." : isColor ? "#RRGGBB" : "Masukkan nilai konfigurasi..."}
                    disabled={loading || uploading}
                    spellCheck={false}
                  />
                )}
                
                {!isImage && !isColor && !isBoolean && (
                  <p className="mt-2 text-xs text-slate-500">Mendukung format Teks, URL, Hex Kode Warna, atau struktur Tag HTML (termasuk Tailwind className).</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
               <Button 
                 variant="outline" 
                 disabled={loading}
                 onClick={() => setIsOpen(false)}
                 className="text-slate-600 border-slate-200"
               >
                 Batal
               </Button>
               <Button 
                 onClick={handleSave} 
                 disabled={loading}
                 className="bg-[#7a1200] hover:bg-[#5a0d00] text-white min-w-[120px]"
               >
                 {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                 Simpan
               </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
