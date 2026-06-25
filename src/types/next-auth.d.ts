// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    isAdmin: boolean
    phone: string
  }

  interface Session {
    user: {
      id: string
      isAdmin: boolean
      phone: string
      name: string
      email: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    isAdmin: boolean
    phone: string
  }
}