import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

const MAX_SIZE = 8 * 1024 * 1024 // 8 MB
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    // slugName is the desired filename in docs, e.g. "admin-dashboard"
    const slugName = (formData.get('slug') as string | null)?.replace(/[^a-z0-9-_]/gi, '-') || `doc-${Date.now()}`

    if (!file) {
      return NextResponse.json({ error: 'File wajib disertakan' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File terlalu besar. Maksimal 8 MB.' }, { status: 400 })
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format tidak didukung. Gunakan PNG, JPEG, atau WebP.' }, { status: 400 })
    }

    const ext = file.type.split('/')[1] || 'png'
    const blobPath = `docs-asset/${slugName}.${ext}`

    const blob = await put(blobPath, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url, slug: slugName })
  } catch (error: any) {
    console.error('Upload docs-asset error:', error)
    if (error?.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'Vercel Blob belum dikonfigurasi. Set BLOB_READ_WRITE_TOKEN di environment.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error?.message || 'Gagal upload file' }, { status: 500 })
  }
}
