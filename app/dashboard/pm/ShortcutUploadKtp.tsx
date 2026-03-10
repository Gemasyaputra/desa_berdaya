'use client'

import React, { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { upload } from '@vercel/blob/client'
import { updateKtpUrlPenerimaManfaat } from './actions'
import { useToast } from '@/hooks/use-toast'

interface ShortcutUploadKtpProps {
  pmId: number
  onSuccess: () => void
}

export default function ShortcutUploadKtp({ pmId, onSuccess }: ShortcutUploadKtpProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Upload ke Vercel Blob
      const blob = await upload(`ktp-${pmId}-${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      // 2. Update Database dengan URL baru
      await updateKtpUrlPenerimaManfaat(pmId, blob.url)

      toast({
        title: 'Berhasil',
        description: 'Foto KTP berhasil diupload.',
      })

      // 3. Trigger Refresh List
      onSuccess()

    } catch (error: any) {
      console.error('Upload shortcut error:', error)
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan saat mengupload KTP.',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // Reset input agar bisa pilih file yang sama lagi kalau gagal
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleUploadClick}
        disabled={isUploading}
        className="h-8 text-[10px] sm:text-xs px-2 sm:px-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50 shrink-0 gap-1 sm:gap-1.5"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="hidden sm:inline">Upload...</span>
          </>
        ) : (
          <>
            <Upload className="w-3 h-3" />
            <span>Upload KTP</span>
          </>
        )}
      </Button>
    </>
  )
}
