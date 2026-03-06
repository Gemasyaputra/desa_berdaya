import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { put } from '@vercel/blob'

const apiKey = process.env.GEMINI_API_KEY
// Inisialisasi Google Gen AI Client
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export async function POST(req: Request) {
  try {
    if (!ai) {
      return NextResponse.json(
        { error: 'Server tidak dikonfigurasi dengan API Key Gemini (GEMINI_API_KEY).' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json(
        { error: 'Gambar tidak ditemukan dalam request.' },
        { status: 400 }
      )
    }

    // Ubah file gambar menjadi base64 string
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')

    // System prompt untuk mengekstrak data KTP
    const systemPrompt = `Anda adalah sistem OCR cerdas yang dikhususkan untuk mengekstrak data dari Kartu Tanda Penduduk (KTP) Indonesia.
    Tugas Anda adalah membaca gambar KTP yang diberikan dan mengembalikan data yang diekstrak secara akurat dalam format JSON persis seperti berikut:
    {
      "nik": "string 16 karakter numerik",
      "nama": "string nama lengkap",
      "tempat_lahir": "string tempat lahir",
      "tanggal_lahir": "YYYY-MM-DD",
      "jenis_kelamin": "LAKI-LAKI / PEREMPUAN",
      "golongan_darah": "string (A/B/O/AB/-)",
      "alamat": "string nama jalan/dusun",
      "rt_rw": "string format RT/RW (contoh 001/002)",
      "kel_desa": "string nama desa/kelurahan",
      "kecamatan": "string nama kecamatan",
      "agama": "string",
      "status_perkawinan": "string",
      "pekerjaan": "string",
      "kewarganegaraan": "WNI / WNA"
    }
    Pastikan hanya mereturn format JSON yang di minta, jangan ada markup \`\`\`json. Jika gagal mengenali NIK atau Nama berikan string kosong.
    `

    // Panggil Gemini 2.5 Flash menggunakan fitur vision
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        systemPrompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: image.type,
          },
        },
      ],
      config: {
        temperature: 0.1,
      }
    });

    const textResponse = response.text || ''

    // Bersihkan potensi formatting markdown dari gemini
    const cleanJsonString = textResponse.replace(/```json\n?|```/g, '').trim()

    let result
    try {
      result = JSON.parse(cleanJsonString)
      // Validasi panjang NIK (seharusnya 16 karakter)
      if (result.nik && result.nik.length !== 16) {
        // Hilangkan spasi atau tanda baca tambahan jika terbawa OCR
        result.nik = result.nik.replace(/\D/g, '').substring(0, 16)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON output:', textResponse)
      return NextResponse.json(
        { error: 'Gagal mengekstrak data berformat JSON dari KTP.' },
        { status: 500 }
      )
    }

    // Process Vercel Blob Upload Concurrent with OCR Result Parsing
    let photoUrl = ''
    try {
      const blob = await put(`ktp/${image.name || 'ktp-scan.jpg'}`, buffer, {
        access: 'public',
        contentType: image.type,
      })
      photoUrl = blob.url
    } catch (uploadError) {
      console.error('Vercel Blob Upload Error:', uploadError)
      // Jangan return error 500 jika upload gagal, lanjutkan saja form.
    }

    return NextResponse.json({ success: true, data: { ...result, foto_ktp_url: photoUrl } })
  } catch (error) {
    console.error('Error scanning KTP via Gemini:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal saat memindai KTP.' },
      { status: 500 }
    )
  }
}
