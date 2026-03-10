'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deletePenerimaManfaat } from './actions'

export default function DeletePMButton({ id, onDeleted }: { id: number; onDeleted?: (id: number) => void }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus data Penerima Manfaat ini?')) {
      try {
        setLoading(true)
        await deletePenerimaManfaat(id)
        if (onDeleted) {
          onDeleted(id)
        }
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
      {loading ? 'Menghapus...' : 'Hapus'}
    </Button>
  )
}
