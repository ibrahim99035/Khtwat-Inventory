import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createProductModel,
  listProductModels,
  getProductModel,
  createColorVariant,
  listVariantsByModel,
} from '../controllers/productModelController.js'

const router = Router()

router.use(auth)

router.get('/', listProductModels)
router.get('/:id', getProductModel)
router.get('/:modelId/variants', listVariantsByModel)

router.post('/', createProductModel)
router.post('/:modelId/variants', createColorVariant)

export default router
