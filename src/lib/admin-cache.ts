// src/lib/admin-cache.ts
'use client'

// ✅ Centralized admin cache
const adminCache = new Map<string, { isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export const adminCacheUtils = {
  get: (userId: string) => {
    const cached = adminCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.isAdmin;
    }
    return null;
  },
  
  set: (userId: string, isAdmin: boolean) => {
    adminCache.set(userId, { isAdmin, timestamp: Date.now() });
  },
  
  clear: () => {
    adminCache.clear();
  },
  
  clearUser: (userId: string) => {
    adminCache.delete(userId);
  }
};