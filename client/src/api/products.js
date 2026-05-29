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

export const getPublicProducts = (params) => api.get('/public/products', { params })
export const getPublicMeta = () => api.get('/public/meta')

export const getSales = (params) => api.get('/sales', { params })
export const getSale = (id) => api.get(`/sales/${id}`)
export const createSale = (payload) => api.post('/sales', payload)
export const addSalePayment = (id, payload) => api.post(`/sales/${id}/payments`, payload)
export const createSaleReturn = (id, payload) => api.post(`/sales/${id}/returns`, payload)

export const getModels = () => api.get('/models')
export const getModelVariants = (modelId) => api.get(`/models/${modelId}/variants`)
export const getInventoryByModel = (modelId) => api.get(`/inventory/model/${modelId}`)
export const getInventoryBySku = (sku) => api.get(`/inventory/sku/${sku}`)
export const getInventoryAdjustments = (sku) => api.get(`/inventory/sku/${sku}/adjustments`)

export const createModel = (payload) => api.post('/models', payload)
export const updateModel = (id, payload) => api.patch(`/models/${id}`, payload)

export const createVariant = (modelId, payload) => api.post(`/models/${modelId}/variants`, payload)
export const updateVariant = (modelId, variantId, payload) =>
  api.patch(`/models/${modelId}/variants/${variantId}`, payload)

export const uploadImages = (files, folder) => {
  const formData = new FormData()
  files.forEach(file => formData.append('images', file))
  if (folder) formData.append('folder', folder)
  return api.post('/models/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const createInventory = (payload) => api.post('/inventory', payload)
export const importInventory = (payload) => api.post('/inventory/import', payload)
export const updateInventoryStock = (sku, payload) => api.patch(`/inventory/sku/${sku}/stock`, payload)
export const adjustInventoryStock = (sku, payload) => api.patch(`/inventory/sku/${sku}/adjust`, payload)
export const updateInventoryMeta = (sku, payload) => api.patch(`/inventory/sku/${sku}/meta`, payload)
