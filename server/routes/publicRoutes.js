import { Router } from 'express'
import { getPublicProducts, getPublicMeta } from '../controllers/productController.js'

const router = Router()

router.get('/products', getPublicProducts)
router.get('/meta', getPublicMeta)

export default router
