import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string
      name?: string | null
      email?: string | null
      role?: string | null
      is_korwil?: boolean | null
      operator_id?: string | null
      monev_id?: string | null
      korwil_id?: string | null
      office_id?: string | null
      jabatan?: string | null
      nama_office?: string | null
    }
  }

  interface User {
    id?: string
    name?: string | null
    role?: string | null
    is_korwil?: boolean | null
    operator_id?: string | null
    monev_id?: string | null
    korwil_id?: string | null
    office_id?: string | null
    jabatan?: string | null
    nama_office?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string | null
    is_korwil?: boolean | null
    operator_id?: string | null
    monev_id?: string | null
    korwil_id?: string | null
    office_id?: string | null
    jabatan?: string | null
    nama_office?: string | null
  }
}
