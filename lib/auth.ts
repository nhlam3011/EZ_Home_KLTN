import { prisma } from './prisma'
import { NextRequest } from 'next/server'

// Import bcryptjs - using require for compatibility
const bcrypt = require('bcryptjs') as typeof import('bcryptjs')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(phone: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          room: true
        },
        take: 1,
        orderBy: { startDate: 'desc' }
      }
    }
  })

  if (!user) {
    return null
  }

  // Check if user is active
  if (!user.isActive) {
    return null
  }

  // For TENANT users, check if they have an active contract
  if (user.role === 'TENANT' && user.contracts.length === 0) {
    return null // Tenant without active contract cannot login
  }

  // Check if password is hashed (bcrypt hash starts with $2a$ or $2b$)
  const isPasswordHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
  
  let isValid = false
  if (isPasswordHashed) {
    // Password is hashed, use bcrypt compare
    isValid = await verifyPassword(password, user.password)
  } else {
    // Password is plain text (for migration/backward compatibility)
    // Auto-hash it for next time
    if (user.password === password) {
      isValid = true
      // Hash the password for next login
      try {
        const hashedPassword = await hashPassword(password)
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
      } catch (error) {
        console.error('Error hashing password during login:', error)
        // Continue with login even if hashing fails
      }
    }
  }

  if (!isValid) {
    return null
  }

  return {
    id: user.id,
    phone: user.phone,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isFirstLogin: user.isFirstLogin,
    room: user.contracts[0]?.room || null
  }
}

/**
 * Get user ID from request
 * Checks Authorization header or query params
 * Note: For body, pass userId separately as it requires reading the body
 */
export function getUserIdFromRequest(request: NextRequest, bodyUserId?: number): number | null {
  // Try to get from body if provided
  if (bodyUserId) {
    return bodyUserId
  }

  // Try to get from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    // Token format: token-{userId}-{timestamp}
    const tokenParts = token.split('-')
    if (tokenParts.length >= 2) {
      const userId = parseInt(tokenParts[1])
      if (!isNaN(userId)) {
        return userId
      }
    }
  }

  // Try to get from query params
  const userIdParam = request.nextUrl.searchParams.get('userId')
  if (userIdParam) {
    const userId = parseInt(userIdParam)
    if (!isNaN(userId)) {
      return userId
    }
  }

  return null
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request: NextRequest, bodyUserId?: number) {
  const userId = getUserIdFromRequest(request, bodyUserId)
  if (!userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: {
          room: true
        },
        take: 1,
        orderBy: { startDate: 'desc' }
      }
    }
  })

  if (!user || !user.isActive) {
    return null
  }

  return user
}
