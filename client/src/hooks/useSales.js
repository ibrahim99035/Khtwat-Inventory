import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/products'
import toast from 'react-hot-toast'

export const useSales = (params) =>
  useQuery({
    queryKey: ['sales', params],
    queryFn: () => api.getSales(params).then(r => r.data),
    keepPreviousData: true,
  })

export const useSale = (id) =>
  useQuery({
    queryKey: ['sale', id],
    queryFn: () => api.getSale(id).then(r => r.data),
    enabled: !!id,
  })

const invalidate = (qc) => {
  qc.invalidateQueries({ queryKey: ['sales'] })
  qc.invalidateQueries({ queryKey: ['sale'] })
  qc.invalidateQueries({ queryKey: ['products'] })
  qc.invalidateQueries({ queryKey: ['stats'] })
}

export const useCreateSale = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createSale,
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تسجيل عملية البيع')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تسجيل البيع'),
  })
}

export const useAddPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => api.addSalePayment(id, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم إضافة الدفعة')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل إضافة الدفعة'),
  })
}

export const useCreateReturn = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => api.createSaleReturn(id, payload),
    onSuccess: () => {
      invalidate(qc)
      toast.success('تم تسجيل المرتجع')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'فشل تسجيل المرتجع'),
  })
}
