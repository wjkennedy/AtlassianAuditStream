import fs from "fs/promises"
import path from "path"

interface StorageItem {
  id: string
  data: any
  timestamp: number
  expires?: number
}

interface SimpleStorageData {
  [key: string]: any
}

class SimpleStorage {
  private dataDir: string
  private memoryCache = new Map<string, StorageItem>()
  private data: SimpleStorageData = {}
  private filePath: string
  private initialized: Promise<void>

  constructor(dataDir = process.env.FILE_STORAGE_PATH || "./data") {
    this.dataDir = dataDir
    this.filePath = path.join(dataDir, "simple_storage.json")
    this.initialized = this.load()
    this.ensureDataDir()
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.error("Failed to create data directory:", error)
    }
  }

  private async load(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath)
      await fs.mkdir(dir, { recursive: true })
      const fileContent = await fs.readFile(this.filePath, "utf-8")
      this.data = JSON.parse(fileContent)
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File does not exist, initialize with empty data and save it
        this.data = {}
        await this.save()
      } else {
        console.error("Failed to load simple storage:", error)
        // Depending on your error handling strategy, you might want to rethrow or handle differently
        throw error
      }
    }
  }

  private async save(): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2), "utf-8")
  }

  private getFilePath(collection: string, id: string): string {
    return path.join(this.dataDir, `${collection}_${id}.json`)
  }

  private getCollectionPath(collection: string): string {
    return path.join(this.dataDir, `${collection}_index.json`)
  }

  async save(collection: string, id: string, data: any, ttlSeconds?: number): Promise<void> {
    const item: StorageItem = {
      id,
      data,
      timestamp: Date.now(),
      expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    }

    // Save to memory cache
    this.memoryCache.set(`${collection}:${id}`, item)

    // Save to file
    try {
      const filePath = this.getFilePath(collection, id)
      await fs.writeFile(filePath, JSON.stringify(item, null, 2))

      // Update collection index
      await this.updateCollectionIndex(collection, id)
    } catch (error) {
      console.error(`Failed to save ${collection}:${id}:`, error)
    }
  }

  async load(collection: string, id: string): Promise<any | null> {
    const cacheKey = `${collection}:${id}`

    // Check memory cache first
    const cached = this.memoryCache.get(cacheKey)
    if (cached) {
      if (cached.expires && Date.now() > cached.expires) {
        this.memoryCache.delete(cacheKey)
        await this.delete(collection, id)
        return null
      }
      return cached.data
    }

    // Load from file
    try {
      const filePath = this.getFilePath(collection, id)
      const content = await fs.readFile(filePath, "utf-8")
      const item: StorageItem = JSON.parse(content)

      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        await this.delete(collection, id)
        return null
      }

      // Cache in memory
      this.memoryCache.set(cacheKey, item)
      return item.data
    } catch (error) {
      return null
    }
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const cacheKey = `${collection}:${id}`

    // Remove from memory cache
    this.memoryCache.delete(cacheKey)

    // Remove file
    try {
      const filePath = this.getFilePath(collection, id)
      await fs.unlink(filePath)

      // Update collection index
      await this.removeFromCollectionIndex(collection, id)
      return true
    } catch (error) {
      return false
    }
  }

  async list(collection: string): Promise<string[]> {
    try {
      const indexPath = this.getCollectionPath(collection)
      const content = await fs.readFile(indexPath, "utf-8")
      return JSON.parse(content)
    } catch (error) {
      return []
    }
  }

  async clear(collection: string): Promise<void> {
    await this.initialized
    const items = await this.list(collection)

    for (const id of items) {
      await this.delete(collection, id)
    }

    // Clear collection index
    try {
      const indexPath = this.getCollectionPath(collection)
      await fs.writeFile(indexPath, JSON.stringify([]))
    } catch (error) {
      console.error(`Failed to clear collection ${collection}:`, error)
    }
  }

  private async updateCollectionIndex(collection: string, id: string): Promise<void> {
    try {
      const indexPath = this.getCollectionPath(collection)
      let index: string[] = []

      try {
        const content = await fs.readFile(indexPath, "utf-8")
        index = JSON.parse(content)
      } catch (error) {
        // Index doesn't exist, start with empty array
      }

      if (!index.includes(id)) {
        index.push(id)
        await fs.writeFile(indexPath, JSON.stringify(index, null, 2))
      }
    } catch (error) {
      console.error(`Failed to update collection index for ${collection}:`, error)
    }
  }

  private async removeFromCollectionIndex(collection: string, id: string): Promise<void> {
    try {
      const indexPath = this.getCollectionPath(collection)
      const content = await fs.readFile(indexPath, "utf-8")
      const index: string[] = JSON.parse(content)

      const filteredIndex = index.filter((item) => item !== id)
      await fs.writeFile(indexPath, JSON.stringify(filteredIndex, null, 2))
    } catch (error) {
      console.error(`Failed to remove from collection index for ${collection}:`, error)
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now()

    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires && now > item.expires) {
        this.memoryCache.delete(key)
      }
    }

    // Clean files (this is more expensive, so we do it less frequently)
    try {
      const files = await fs.readdir(this.dataDir)

      for (const file of files) {
        if (file.endsWith(".json") && !file.endsWith("_index.json")) {
          const filePath = path.join(this.dataDir, file)
          try {
            const content = await fs.readFile(filePath, "utf-8")
            const item: StorageItem = JSON.parse(content)

            if (item.expires && now > item.expires) {
              await fs.unlink(filePath)

              // Extract collection and id from filename
              const [collection, id] = file.replace(".json", "").split("_")
              if (collection && id) {
                await this.removeFromCollectionIndex(collection, id)
              }
            }
          } catch (error) {
            console.error(`Failed to process file ${file}:`, error)
          }
        }
      }
    } catch (error) {
      console.error("Failed to cleanup files:", error)
    }
  }

  public async get<T>(key: string): Promise<T | undefined> {
    await this.initialized // Ensure data is loaded before accessing
    return this.data[key] as T
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.initialized // Ensure data is loaded before modifying
    this.data[key] = value
    await this.save()
  }

  public async getAll(): Promise<SimpleStorageData> {
    await this.initialized
    return { ...this.data } // Return a copy to prevent direct modification
  }
}

// Global storage instance
export const storage = new SimpleStorage()

// Helper functions for common storage patterns
export const storageHelpers = {
  // Store audit events
  saveAuditEvent: async (event: any) => {
    const id = `${event.id || Date.now()}`
    await storage.save("audit_events", id, event)
    return id
  },

  getAuditEvent: async (id: string) => {
    return await storage.load("audit_events", id)
  },

  listAuditEvents: async () => {
    return await storage.list("audit_events")
  },

  // Store configuration
  saveConfig: async (key: string, value: any) => {
    await storage.save("config", key, value)
  },

  getConfig: async (key: string) => {
    return await storage.load("config", key)
  },

  // Store alert rules
  saveAlertRule: async (rule: any) => {
    const id = rule.id || `rule_${Date.now()}`
    await storage.save("alert_rules", id, rule)
    return id
  },

  getAlertRule: async (id: string) => {
    return await storage.load("alert_rules", id)
  },

  listAlertRules: async () => {
    return await storage.list("alert_rules")
  },
}

// Start cleanup interval
setInterval(
  () => {
    storage.cleanup()
  },
  10 * 60 * 1000,
) // Every 10 minutes
