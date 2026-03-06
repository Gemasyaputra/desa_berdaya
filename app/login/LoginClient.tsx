'use client'

import React, { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { signIn, useSession } from 'next-auth/react'
import { APP_SETTINGS_KEYS } from '@/lib/app-settings-keys'

type LoginSettings = Partial<Record<string, string>>

function ErrorMessageHandler({ onError }: { onError: (message: string | null) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'AccessDenied') {
      onError('Akun Google Anda tidak terdaftar di sistem. Silakan hubungi admin.')
    } else {
      onError(null)
    }
  }, [searchParams])
  return null
}

export function LoginClient({ settings }: { settings: LoginSettings }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const logoUrl = settings?.[APP_SETTINGS_KEYS.LOGO_URL] || '/asset/logo_csf_new.png'
  const companyName = settings?.[APP_SETTINGS_KEYS.COMPANY_NAME] || 'Cita Sehat Foundation'
  const bgImage = settings?.[APP_SETTINGS_KEYS.LOGIN_BG_IMAGE] || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d'
  const toneBg = settings?.[APP_SETTINGS_KEYS.LOGIN_TONE_BG] || 'linear-gradient(to bottom right, rgba(19,78,74,0.85), rgba(25,58,58,0.75), rgba(30,58,138,0.85))'
  const brandColor = settings?.['app_sidebar_bg_color'] || '#00786F'
  const defaultLoginContent = `<h2>Kelola Klinik dengan Lebih Efisien</h2>
<p>Pantau transaksi, kelola pasien, dan optimalkan operasional klinik dalam satu dashboard yang terpadu.</p>
<ul>
<li><strong>Monitoring Real-time</strong> — Lihat progres transaksi dan aktivitas klinik secara langsung dengan update real-time.</li>
<li><strong>Tim Lebih Terkoordinasi</strong> — Berikan akses terkontrol untuk operator dan tim lapangan dengan manajemen peran yang fleksibel.</li>
<li><strong>Laporan Siap Pakai</strong> — Unduh laporan transaksi dan kehadiran pasien untuk evaluasi dan analisis operasional klinik.</li>
</ul>`
  const loginContent = settings?.[APP_SETTINGS_KEYS.LOGIN_CONTENT] ?? defaultLoginContent

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard')
  }, [status, router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setErrorMessage(null)
      const res = await signIn('credentials', { 
        email, 
        password, 
        redirect: false 
      })
      if (res?.error) {
        setErrorMessage('Email atau password salah')
      } else if (res?.ok) {
        router.push('/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      <Suspense fallback={null}>
        <ErrorMessageHandler onError={setErrorMessage} />
      </Suspense>

      <div className="absolute inset-0 z-0">
        {/* Solid color base fallback */}
        <div className="absolute inset-0" style={{ backgroundColor: brandColor }} />
        {/* Background Image layer */}
        {bgImage && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
        )}
        {/* Tone / Overlay layer */}
        <div
          className="absolute inset-0"
          style={{
            background: toneBg.includes('gradient') || toneBg.includes('rgba')
              ? toneBg
              : `${toneBg}CC`
          }}
        />
        <div className="absolute inset-0 backdrop-blur-md md:backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="w-full flex justify-center lg:justify-start">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 md:space-y-8 border border-white/20">
                <div className="flex justify-center">
                  <div className="relative w-48 h-16 md:w-56 md:h-20">
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      fill
                      className="object-contain"
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/icon.svg'
                      }}
                    />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Executive Dashboard</h1>
                  <p className="text-xs md:text-sm text-slate-500">
                    Gunakan akun Google yang telah terdaftar untuk mengakses dashboard admin.
                  </p>
                </div>
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs md:text-sm text-red-700 font-medium">{errorMessage}</p>
                    </div>
                  </div>
                )}
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="admin@desaberdaya.id"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    style={{ backgroundColor: brandColor }}
                    className="w-full h-12 md:h-14 text-white rounded-xl font-semibold text-sm md:text-base shadow-sm transition-all duration-200 flex items-center justify-center gap-3 mt-4 hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Masuk ke Dashboard</span>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-center text-slate-500 leading-relaxed px-4">
                  Dengan masuk, Anda menyetujui{' '}
                  <a href="#" style={{ color: brandColor }} className="font-medium underline underline-offset-2 hover:opacity-80">Syarat &amp; Ketentuan</a>
                  {' '}dan{' '}
                  <a href="#" style={{ color: brandColor }} className="font-medium underline underline-offset-2 hover:opacity-80">Kebijakan Privasi</a>.
                </p>
              </div>
              <p className="text-center text-white/90 text-sm mt-6 lg:hidden">
                © 2026 {companyName}. All rights reserved.
              </p>
            </div>
          </div>

          <div
            className="hidden lg:block text-white text-lg xl:text-xl leading-relaxed space-y-4 prose prose-invert prose-headings:text-white prose-p:text-white/90 prose-li:text-white/90 max-w-none [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_ul]:marker:text-white [&_ol]:marker:text-white"
            dangerouslySetInnerHTML={{ __html: loginContent }}
          />
        </div>
        <p className="hidden lg:block text-center text-white/90 text-sm mt-8">
          © 2026 {companyName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}
