// Simple in-memory cache to replace Redis
interface CacheItem<T> {
  value: T
  expires: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expires = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expires })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Global cache instance
export const cache = new SimpleCache()

// Helper functions for common caching patterns
export const cacheHelpers = {
  // Cache API responses
  cacheApiResponse: <T>(key: string, data: T, ttlSeconds = 300) => {
    cache.set(`api:${key}`, data, ttlSeconds)
  },

  getCachedApiResponse: <T>(key: string): T | null => {
    return cache.get<T>(`api:${key}`)
  },

  // Cache user sessions (if needed)
  cacheSession: (sessionId: string, data: any, ttlSeconds = 3600) => {
    cache.set(`session:${sessionId}`, data, ttlSeconds)
  },

  getSession: (sessionId: string): any | null => {
    return cache.get(`session:${sessionId}`)
  },

  // Cache configuration
  cacheConfig: (key: string, value: any, ttlSeconds = 1800) => {
    cache.set(`config:${key}`, value, ttlSeconds)
  },

  getCachedConfig: (key: string): any | null => {
    return cache.get(`config:${key}`)
  }
}
