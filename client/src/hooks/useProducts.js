import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products'
import toast from 'react-hot-toast'

export const useStats = () =>
  useQuery({ queryKey: ['stats'], queryFn: () => api.getStats().then(r => r.data) })

export const useMeta = () =>
  useQuery({ queryKey: ['meta'], queryFn: () => api.getMeta().then(r => r.data) })

export const usePublicMeta = () =>
  useQuery({ queryKey: ['public-meta'], queryFn: () => api.getPublicMeta().then(r => r.data) })

export const useProducts = (params) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () => api.getProducts(params).then(r => r.data),
    keepPreviousData: true,
  })

export const usePublicProducts = (params) =>
  useQuery({
    queryKey: ['public-products', params],
    queryFn: () => api.getPublicProducts(params).then(r => r.data),
    keepPreviousData: true,
  })

export const useModels = () =>
  useQuery({ queryKey: ['models'], queryFn: () => api.getModels().then(r => r.data) })

export const useModelVariants = (modelId) =>
  useQuery({
    queryKey: ['model-variants', modelId],
    queryFn: () => api.getModelVariants(modelId).then(r => r.data),
    enabled: !!modelId,
  })

export const useInventoryByModel = (modelId) =>
  useQuery({
    queryKey: ['inventory-model', modelId],
    queryFn: () => api.getInventoryByModel(modelId).then(r => r.data),
    enabled: !!modelId,
  })

export const useProduct = (id) =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id).then(r => r.data),
    enabled: !!id,
  })

const invalidate = (qc) => {
  qc.invalidateQueries({ queryKey: ['products'] })
  qc.invalidateQueries({ queryKey: ['stats'] })
  qc.invalidateQueries({ queryKey: ['meta'] })
}

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم إنشاء المنتج')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل إنشاء المنتج'),
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => api.updateProduct(id, formData),
    onSuccess: (_, { id }) => {
      invalidate(qc)
      qc.invalidateQueries({ queryKey: ['product', id] })
      toast.success('تم تحديث المنتج')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث المنتج'),
  })
}

export const useUpdateSizeStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, variantId, size, stock }) =>
      api.updateSizeStock(productId, variantId, size, stock),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تحديث المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث المخزون'),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم حذف المنتج')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل حذف المنتج'),
  })
}

export const useBulkDelete = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.bulkDelete,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم حذف المنتجات')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل حذف المنتجات'),
  })
}

export const useImportProducts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ products, overwrite }) => api.importProducts(products, overwrite),
    onSuccess: (res) => {
      invalidate(qc)
      const { created, updated, skipped } = res.data
      toast.success(`تم الاستيراد: ${created} جديد، ${updated} محدث، ${skipped} متجاوز`)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل الاستيراد'),
  })
}
