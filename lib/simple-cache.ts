interface CacheItem<T> {
  value: T
  expiry: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()
  private defaultTTL = 300000 // 5 minutes

  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { value, expiry })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  size(): number {
    // Clean expired items first
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }
}

const cache = new SimpleCache()

export const cacheHelpers = {
  setCachedApiResponse: <T,>(key: string, data: T, ttl?: number): void => {
    cache.set(`api:${key}`, data, ttl)
  },

  getCachedApiResponse: <T,>(key: string): T | null => cache.get<T>(`api:${key}`),

  setCachedAuditEvent: <T,>(key: string, event: T, ttl?: number): void => {
    cache.set(`audit:${key}`, event, ttl)
  },

  getCachedAuditEvent: <T,>(key: string): T | null => cache.get<T>(`audit:${key}`),

  invalidateCache: (pattern: string): void => {
    // Simple pattern matching - could be enhanced
    for (const key of Array.from(cache["cache"].keys())) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  },

  clearAllCache: (): void => {
    cache.clear()
  },

  getCacheStats: () => ({
    size: cache.size(),
    keys: Array.from(cache["cache"].keys()),
  }),
}

export default cache
