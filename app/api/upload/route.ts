import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request): Promise<NextResponse> {
  console.log('--- [API UPLOAD] Received POST request')
  
  try {
    const body = (await request.json()) as HandleUploadBody
    console.log('--- [API UPLOAD] Body parsed, Action:', body.type)

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log('--- [API UPLOAD] onBeforeGenerateToken for', pathname)
        try {
          // Authenticate the user
          const session = await getServerSession(authOptions)
          console.log('--- [API UPLOAD] session retrieved:', !!session)
          
          if (!session?.user) {
            throw new Error('Unauthorized')
          }

          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
            tokenPayload: JSON.stringify({
              userId: session.user.id,
              role: session.user.role
            }),
          }
        } catch (err: any) {
          console.error('--- [API UPLOAD] ERROR in onBeforeGenerateToken:', err.message)
          throw err
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('--- [API UPLOAD] Blob upload completed', blob.url, tokenPayload)
      },
    })

    console.log('--- [API UPLOAD] handleUpload success')
    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('--- [API UPLOAD] handleUpload ERROR:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    )
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-vercel-blob-format',
    },
  })
}
