/**
 * Cache Layer Tests - اختبارات طبقة التخزين المؤقت
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Mock the cache module inline
class TestCacheManager {
  private store = new Map<string, { data: any; expiresAt: number; tags: string[] }>();
  hitCount = 0; missCount = 0;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.missCount++;
      return null;
    }
    this.hitCount++;
    return entry.data;
  }

  async set<T>(key: string, data: T, ttl = 300, tags: string[] = []): Promise<void> {
    this.store.set(key, { data, expiresAt: Date.now() + ttl * 1000, tags });
  }

  async delete(key: string): Promise<void> { this.store.delete(key); }

  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;
    for (const [key, entry] of this.store) {
      if (entry.tags.includes(tag)) { this.store.delete(key); count++; }
    }
    return count;
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) { this.store.delete(key); count++; }
    }
    return count;
  }

  async flush(): Promise<void> { this.store.clear(); this.hitCount = 0; this.missCount = 0; }
  
  getStats() {
    const total = this.hitCount + this.missCount;
    return {
      entries: this.store.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? ((this.hitCount / total) * 100).toFixed(2) + '%' : '0%',
    };
  }
}

describe('Cache Layer - طبقة التخزين المؤقت', () => {
  let cache: TestCacheManager;

  beforeEach(() => {
    cache = new TestCacheManager();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', async () => {
      await cache.set('test:key', { name: 'test' });
      const result = await cache.get('test:key');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for missing keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should delete entries', async () => {
      await cache.set('test:key', 'value');
      await cache.delete('test:key');
      expect(await cache.get('test:key')).toBeNull();
    });

    it('should expire entries after TTL', async () => {
      await cache.set('test:key', 'value', 0); // 0 sec TTL = expired immediately
      // Need to wait a ms for expiration
      await new Promise(r => setTimeout(r, 10));
      expect(await cache.get('test:key')).toBeNull();
    });
  });

  describe('Tag-based Invalidation', () => {
    it('should invalidate entries by tag', async () => {
      await cache.set('hr:emp:1', 'emp1', 300, ['hr']);
      await cache.set('hr:emp:2', 'emp2', 300, ['hr']);
      await cache.set('finance:acc:1', 'acc1', 300, ['finance']);
      
      const invalidated = await cache.invalidateByTag('hr');
      expect(invalidated).toBe(2);
      expect(await cache.get('hr:emp:1')).toBeNull();
      expect(await cache.get('finance:acc:1')).toEqual('acc1');
    });
  });

  describe('Pattern-based Invalidation', () => {
    it('should invalidate entries by pattern', async () => {
      await cache.set('hr:employees:list', []);
      await cache.set('hr:employees:1', {});
      await cache.set('hr:leaves:list', []);
      
      const invalidated = await cache.invalidateByPattern('hr:employees:*');
      expect(invalidated).toBe(2);
      expect(await cache.get('hr:leaves:list')).toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      await cache.set('key1', 'value1');
      
      await cache.get('key1');       // hit
      await cache.get('key1');       // hit
      await cache.get('missing');    // miss
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('66.67%');
    });
  });

  describe('Flush', () => {
    it('should clear all entries', async () => {
      await cache.set('key1', 'v1');
      await cache.set('key2', 'v2');
      await cache.set('key3', 'v3');
      
      await cache.flush();
      
      expect(await cache.get('key1')).toBeNull();
      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe('ERP Scenarios - سيناريوهات عملية', () => {
    it('should cache employee list and invalidate on change', async () => {
      const employees = [{ id: 1, name: 'أحمد' }, { id: 2, name: 'سارة' }];
      
      await cache.set('hr:employees:list', employees, 300, ['hr']);
      
      // قراءة من الكاش
      expect(await cache.get('hr:employees:list')).toEqual(employees);
      
      // عند إضافة موظف جديد يتم إبطال الكاش
      await cache.invalidateByTag('hr');
      expect(await cache.get('hr:employees:list')).toBeNull();
    });

    it('should cache dashboard stats separately per module', async () => {
      await cache.set('dashboard:hr:stats', { count: 100 }, 60, ['dashboard']);
      await cache.set('dashboard:finance:stats', { balance: 50000 }, 60, ['dashboard']);
      
      // كل وحدة لها كاش مستقل
      expect(await cache.get('dashboard:hr:stats')).toEqual({ count: 100 });
      expect(await cache.get('dashboard:finance:stats')).toEqual({ balance: 50000 });
      
      // إبطال كل لوحات التحكم معاً
      await cache.invalidateByTag('dashboard');
      expect(cache.getStats().entries).toBe(0);
    });
  });
});
