'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteLaporanKeuangan } from './actions'

export default function DeleteLaporanButton({ id }: { id: number }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus data Laporan Kegiatan ini?')) {
      try {
        setLoading(true)
        await deleteLaporanKeuangan(id)
        window.location.reload() // Refresh layar agar tabel yang diambil secara CSR terupdate
      } catch (error: any) {
        alert(error.message || 'Gagal menghapus data')
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
