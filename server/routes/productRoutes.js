import { Router } from 'express'
import {
  getProducts,
  getProduct,
  getMeta,
  getStats,
  createProduct,
  updateProduct,
  updateSizeStock,
  deleteProduct,
  bulkDelete,
  importProducts,
  exportProducts,
} from '../controllers/productController.js'
import auth from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.use(auth)

router.get('/meta', getMeta)
router.get('/stats', getStats)
router.get('/export', exportProducts)
router.get('/', getProducts)
router.get('/:id', getProduct)

router.post('/', upload.array('images', 10), createProduct)
router.put('/:id', upload.array('images', 10), updateProduct)

router.patch('/:id/variants/:variantId/sizes/:size', updateSizeStock)

router.delete('/bulk', bulkDelete)
router.delete('/:id', deleteProduct)

router.post('/import', importProducts)

export default router
