import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FormProfil from './FormProfil'
import { getMyProfile } from './actions'

export const metadata = {
  title: 'Profil Saya - Desa Berdaya',
}

export default async function ProfilPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Hanya ambil jika Relawan / User. Role admin mungkin ga ada row-nya di DB relawan
  const role = (session.user as any)?.role || 'USER'
  
  if (role !== 'RELAWAN' && role !== 'USER') {
    return (
      <div className="p-8">
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <h2 className="text-amber-800 font-bold text-lg mb-2">Akses Terbatas</h2>
          <p className="text-amber-700 text-sm">Halaman "Profil Saya" ini saat ini khusus disediakan untuk mitra Relawan. Anda masuk sebagai tipe akun {role}.</p>
        </div>
      </div>
    )
  }

  const { data: initialData, error } = await getMyProfile()

  if (error || !initialData) {
    return (
      <div className="p-8">
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <h2 className="text-red-800 font-bold text-lg mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-red-700 text-sm">Gagal memuat profil relawan: {error || 'Data kosong'}.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 pt-6 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Profil Saya</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Lengkapi data profil Anda di bawah ini agar mudah dihubungi dan sinkron dengan sistem.
          </p>
        </div>
      </div>

      <FormProfil initialData={initialData} />
    </div>
  )
}
