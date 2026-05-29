import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createProductModel,
  listProductModels,
  getProductModel,
  createColorVariant,
  listVariantsByModel,
  updateProductModel,
  updateColorVariant,
  uploadModelImages,
} from '../controllers/productModelController.js'
import { upload } from '../middleware/upload.js'

const router = Router()

router.use(auth)

router.get('/', listProductModels)
router.get('/:id', getProductModel)
router.get('/:modelId/variants', listVariantsByModel)

router.post('/', createProductModel)
router.post('/:modelId/variants', createColorVariant)
router.post('/upload', upload.array('images', 10), uploadModelImages)

router.patch('/:id', updateProductModel)
router.patch('/:modelId/variants/:variantId', updateColorVariant)

export default router
