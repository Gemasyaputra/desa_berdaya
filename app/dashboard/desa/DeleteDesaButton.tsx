'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteDesaBinaan } from './actions'

export default function DeleteDesaButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus Desa Binaan ini? Semua Penerima Manfaat dan Laporan Keuangan terkait juga berpotensi terhapus.')) {
      try {
        setLoading(true)
        await deleteDesaBinaan(id)
        window.location.reload()
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus desa')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete}
      disabled={loading}
      className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
    >
      {loading ? 'Hapus...' : 'Hapus'}
    </Button>
  )
}
