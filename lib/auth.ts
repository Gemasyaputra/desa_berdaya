import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const users = await sql`
            SELECT id, email, password_encrypted, role
            FROM users
            WHERE email = ${credentials.email}
            LIMIT 1
          `
          const dbUser = (Array.isArray(users) ? users[0] : users) as any

          if (!dbUser) return null

          // Verify password
          const passwordsMatch = await bcrypt.compare(credentials.password, dbUser.password_encrypted)
          if (!passwordsMatch) return null

          let operatorData: any = {
            name: dbUser.email,
            is_korwil: false,
            operator_id: null,
            monev_id: null,
            korwil_id: null
          }

          if (dbUser.role === 'MONEV') {
            const monevs = await sql`SELECT id, nama FROM monev WHERE user_id = ${dbUser.id} LIMIT 1`
            const monev = (Array.isArray(monevs) ? monevs[0] : monevs) as any
            if (monev) {
              operatorData.name = monev.nama
              operatorData.operator_id = String(monev.id)
            }
          } else if (dbUser.role === 'RELAWAN' || dbUser.role === 'PROG_HEAD' || dbUser.role === 'ADMIN' || dbUser.role === 'FINANCE') {
            // Check into relawan table since PROG_HEAD is treated as Korwil in dummy data
            const relawans = await sql`SELECT id, nama, is_korwil, monev_id, korwil_id FROM relawan WHERE user_id = ${dbUser.id} LIMIT 1`
            const relawan = (Array.isArray(relawans) ? relawans[0] : relawans) as any
            if (relawan) {
              operatorData.name = relawan.nama
              operatorData.operator_id = String(relawan.id)
              operatorData.is_korwil = relawan.is_korwil
              operatorData.monev_id = relawan.monev_id ? String(relawan.monev_id) : null
              operatorData.korwil_id = relawan.korwil_id ? String(relawan.korwil_id) : null
            }
          }

          return {
            id: String(dbUser.id),
            email: dbUser.email,
            role: dbUser.role,
            ...operatorData
          }
        } catch (error) {
          console.error('Error in authorize callback:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.is_korwil = user.is_korwil
        token.operator_id = user.operator_id
        token.monev_id = user.monev_id
        token.korwil_id = user.korwil_id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.is_korwil = token.is_korwil as boolean
        session.user.operator_id = token.operator_id as string
        session.user.monev_id = token.monev_id as string
        session.user.korwil_id = token.korwil_id as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
