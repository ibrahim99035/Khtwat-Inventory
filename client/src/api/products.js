import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const login = (body) => api.post('/auth/login', body)
export const logout = () => api.post('/auth/logout')
export const getMe = () => api.get('/auth/me')

export const getProducts = (params) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const getMeta = () => api.get('/products/meta')
export const getStats = () => api.get('/products/stats')
export const getPublicProducts = (params) => api.get('/public/products', { params })
export const getPublicMeta = () => api.get('/public/meta')

export const createProduct = (formData) =>
  api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateProduct = (id, formData) =>
  api.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const updateSizeStock = (productId, variantId, size, stock) =>
  api.patch(`/products/${productId}/variants/${variantId}/sizes/${size}`, { stock })

export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const bulkDelete = (ids) => api.delete('/products/bulk', { data: { ids } })

export const importProducts = (products, overwrite) =>
  api.post('/products/import', { products, overwrite })

export const exportCSV = () =>
  api.get('/products/export', { responseType: 'blob' })

export const getSales = (params) => api.get('/sales', { params })
export const getSale = (id) => api.get(`/sales/${id}`)
export const createSale = (payload) => api.post('/sales', payload)
export const addSalePayment = (id, payload) => api.post(`/sales/${id}/payments`, payload)
export const createSaleReturn = (id, payload) => api.post(`/sales/${id}/returns`, payload)

export const getModels = () => api.get('/models')
export const getModelVariants = (modelId) => api.get(`/models/${modelId}/variants`)
export const getInventoryByModel = (modelId) => api.get(`/inventory/model/${modelId}`)
