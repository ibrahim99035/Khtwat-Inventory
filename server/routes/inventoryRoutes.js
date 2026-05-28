import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createInventory,
  updateStock,
  reserveStock,
  releaseStock,
  markDamaged,
  getInventoryBySku,
  getInventoryByModel,
  getInventoryBySize,
  getLowStock,
  exportInventoryCsv,
} from '../controllers/inventoryController.js'

const router = Router()

router.use(auth)

router.get('/export', exportInventoryCsv)
router.get('/low-stock', getLowStock)
router.get('/sku/:sku', getInventoryBySku)
router.get('/model/:modelId', getInventoryByModel)
router.get('/size/:euSize', getInventoryBySize)

router.post('/', createInventory)
router.patch('/sku/:sku/stock', updateStock)
router.patch('/sku/:sku/reserve', reserveStock)
router.patch('/sku/:sku/release', releaseStock)
router.patch('/sku/:sku/damaged', markDamaged)

export default router
