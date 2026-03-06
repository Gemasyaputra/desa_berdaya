import React from 'react'
import { getPenerimaManfaatById } from '../actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserSquare2, MapPin, Calendar, Briefcase, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

function formatDate(dateString: string | Date | null) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(date)
}

function calculateAge(dateString: string | Date | null) {
  if (!dateString) return ''
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age ? `(${age} Tahun)` : ''
}

export default async function DetailPMPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const resolvedParams = await params
  const id = parseInt(resolvedParams.id)
  if (isNaN(id)) {
    redirect('/dashboard/pm')
  }

  let pmDetail: any = null
  let errorMessage = ''

  try {
    pmDetail = await getPenerimaManfaatById(id)
  } catch (error: any) {
    errorMessage = error.message
  }

  if (errorMessage || !pmDetail) {
    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 w-full max-w-md text-center">
          <p className="font-semibold mb-4">{errorMessage || 'Data tidak ditemukan'}</p>
          <Link href="/dashboard/pm">
            <Button variant="outline" className="border-red-200 hover:bg-red-100">Kembali ke Daftar</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/pm">
          <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 border-slate-200">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Penerima Manfaat</h1>
          <p className="text-slate-500 text-sm mt-0.5">Informasi lengkap biodata peserta program bantuan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] mb-4 border-4 border-white shadow-sm">
              <UserSquare2 className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{pmDetail.nama}</h2>
            <p className="font-mono text-sm text-slate-500 mt-1">{pmDetail.nik}</p>
            
            <div className="mt-4 pt-4 border-t w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Desa Binaan</span>
                <span className="font-medium text-slate-800">{pmDetail.nama_desa}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Kategori Bantuan</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {pmDetail.kategori_pm}
                </span>
              </div>
            </div>
          </div>

          {/* KTP Photo Section */}
          {pmDetail.foto_ktp_url && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                <span>Foto KTP</span>
                <span className="text-xs font-normal text-slate-500">Klik untuk perbesar</span>
              </h3>
              <a href={pmDetail.foto_ktp_url} target="_blank" rel="noopener noreferrer" className="block relative aspect-[1.6/1] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity">
                <img 
                  src={pmDetail.foto_ktp_url} 
                  alt="Foto KTP" 
                  className="w-full h-full object-cover"
                />
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Information */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <UserSquare2 className="w-4 h-4 text-[#7a1200]" />
                Biodata Diri (Sesuai KTP)
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tempat Lahir</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.tempat_lahir || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal Lahir</p>
                <p className="text-sm font-semibold text-slate-800">
                  {formatDate(pmDetail.tanggal_lahir)} <span className="text-slate-500 font-normal">{calculateAge(pmDetail.tanggal_lahir)}</span>
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Jenis Kelamin</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.jenis_kelamin || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Golongan Darah</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.golongan_darah || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7a1200]" />
                Detail Alamat
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div className="sm:col-span-2 space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alamat Lengkap</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.alamat || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">RT/RW</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.rt_rw || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kelurahan/Desa</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.kel_desa || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kecamatan</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.kecamatan || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#7a1200]" />
                Data Tambahan
              </h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agama</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.agama || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Perkawinan</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.status_perkawinan || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pekerjaan</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.pekerjaan || '-'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kewarganegaraan</p>
                <p className="text-sm font-semibold text-slate-800">{pmDetail.kewarganegaraan || '-'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
