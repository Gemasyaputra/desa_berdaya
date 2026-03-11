import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { sql } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
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
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        try {
          // Hanya izinkan email yang terdaftar di database users kita
          const users = await sql`
            SELECT id
            FROM users
            WHERE email = ${email}
            LIMIT 1
          `
          const dbUser = (Array.isArray(users) ? users[0] : users) as any
          
          if (!dbUser) {
            // Akses ditolak karena bukan admin/relawan bersangkutan
            return '/login?error=AccessDenied'
          }

          return true
        } catch (error) {
          console.error(error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // populate the token with DB user info upon first login callback
      if (user && account?.provider === 'google') {
        const email = user.email
        if (email) {
          try {
            const users = await sql`
              SELECT id, email, role
              FROM users
              WHERE email = ${email}
              LIMIT 1
            `
            const dbUser = (Array.isArray(users) ? users[0] : users) as any
            
            if (dbUser) {
              token.sub = String(dbUser.id)
              token.role = dbUser.role
              token.is_korwil = false
              token.operator_id = null
              token.monev_id = null
              token.korwil_id = null
              token.name = dbUser.email

              if (dbUser.role === 'MONEV') {
                const monevs = await sql`SELECT id, nama FROM monev WHERE user_id = ${dbUser.id} LIMIT 1`
                const monev = (Array.isArray(monevs) ? monevs[0] : monevs) as any
                if (monev) {
                  token.operator_id = String(monev.id)
                  token.name = monev.nama
                }
              } else if (dbUser.role === 'RELAWAN' || dbUser.role === 'PROG_HEAD' || dbUser.role === 'ADMIN' || dbUser.role === 'FINANCE') {
                const relawans = await sql`SELECT id, nama, is_korwil, monev_id, korwil_id FROM relawan WHERE user_id = ${dbUser.id} LIMIT 1`
                const relawan = (Array.isArray(relawans) ? relawans[0] : relawans) as any
                if (relawan) {
                  token.operator_id = String(relawan.id)
                  token.is_korwil = relawan.is_korwil
                  token.monev_id = relawan.monev_id ? String(relawan.monev_id) : null
                  token.korwil_id = relawan.korwil_id ? String(relawan.korwil_id) : null
                  token.name = relawan.nama
                }
              }
            }
          } catch(e) {
            console.error("JWT Callback error: ", e)
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.is_korwil = token.is_korwil as boolean
        session.user.operator_id = token.operator_id as string
        session.user.monev_id = token.monev_id as string
        session.user.korwil_id = token.korwil_id as string
        if (token.name) {
          session.user.name = token.name as string
        }
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
