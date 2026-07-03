const PRODUCTS_CACHE_KEY = 'admin_products_payload_v2'
const PRODUCTS_CACHE_TTL = 2 * 60 * 1000

function readRawProductsCache() {
  if (typeof window === 'undefined') return {}

  try {
    return JSON.parse(window.sessionStorage.getItem(PRODUCTS_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeRawProductsCache(cache) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage issues.
  }
}

export function productCacheKey(params) {
  return JSON.stringify({
    search: params.search || '',
    category_id: params.category_id || '',
    manufacturer_id: params.manufacturer_id || '',
    status: params.status || '',
    prescription: params.prescription || '',
    page: params.page || 1,
  })
}

export function readProductsCache(params) {
  if (typeof window === 'undefined') return null

  try {
    const cache = readRawProductsCache()
    const cached = cache[productCacheKey(params)]
    if (!cached || Date.now() - cached.cachedAt > PRODUCTS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

export function writeProductsCache(params, payload) {
  const cache = readRawProductsCache()
  cache[productCacheKey(params)] = { payload, cachedAt: Date.now() }
  writeRawProductsCache(cache)
}

export function updateProductInCaches(product) {
  if (!product?.id) return

  const cache = readRawProductsCache()
  const nextCache = Object.fromEntries(
    Object.entries(cache).map(([key, value]) => {
      const payload = value?.payload
      const rows = payload?.products

      if (!Array.isArray(rows)) {
        return [key, value]
      }

      const hasMatch = rows.some((row) => Number(row?.id) === Number(product.id))
      if (!hasMatch) {
        return [key, value]
      }

      return [key, {
        ...value,
        cachedAt: Date.now(),
        payload: {
          ...payload,
          products: rows.map((row) => (Number(row?.id) === Number(product.id) ? { ...row, ...product } : row)),
        },
      }]
    }),
  )

  writeRawProductsCache(nextCache)
}

export function clearProductsCache() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(PRODUCTS_CACHE_KEY)
  }
}
