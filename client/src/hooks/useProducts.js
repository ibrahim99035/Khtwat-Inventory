import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products'
import toast from 'react-hot-toast'

export const usePublicMeta = () =>
  useQuery({ queryKey: ['public-meta'], queryFn: () => api.getPublicMeta().then(r => r.data) })

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

export const useInventoryBySku = (sku) =>
  useQuery({
    queryKey: ['inventory-sku', sku],
    queryFn: () => api.getInventoryBySku(sku).then(r => r.data),
    enabled: !!sku,
  })

const invalidate = (qc) => {
  qc.invalidateQueries({ queryKey: ['models'] })
  qc.invalidateQueries({ queryKey: ['model-variants'] })
  qc.invalidateQueries({ queryKey: ['inventory-model'] })
}

export const useCreateModel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createModel,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم إنشاء الموديل')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل إنشاء الموديل'),
  })
}

export const useUpdateModel = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => api.updateModel(id, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تحديث الموديل')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث الموديل'),
  })
}

export const useCreateVariant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ modelId, payload }) => api.createVariant(modelId, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم إنشاء اللون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل إنشاء اللون'),
  })
}

export const useUpdateVariant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ modelId, variantId, payload }) => api.updateVariant(modelId, variantId, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تحديث اللون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث اللون'),
  })
}

export const useCreateInventory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createInventory,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم إضافة المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل إضافة المخزون'),
  })
}

export const useUpdateInventoryStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sku, payload }) => api.updateInventoryStock(sku, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تحديث المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث المخزون'),
  })
}

export const useUpdateInventoryMeta = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sku, payload }) => api.updateInventoryMeta(sku, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تحديث بيانات المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تحديث بيانات المخزون'),
  })
}

export const useAdjustInventoryStock = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sku, payload }) => api.adjustInventoryStock(sku, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تعديل المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تعديل المخزون'),
  })
}

export const useImportInventory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.importInventory,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم استيراد المخزون')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل استيراد المخزون'),
  })
}

