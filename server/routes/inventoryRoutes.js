import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  createInventory,
  importInventory,
  updateStock,
  adjustStock,
  reserveStock,
  releaseStock,
  markDamaged,
  updateInventoryMeta,
  getInventoryBySku,
  getInventoryByModel,
  getInventoryBySize,
  getLowStock,
  exportInventoryCsv,
  getInventoryAdjustments,
} from '../controllers/inventoryController.js'

const router = Router()

router.use(auth)

router.get('/export', exportInventoryCsv)
router.get('/low-stock', getLowStock)
router.get('/sku/:sku', getInventoryBySku)
router.get('/sku/:sku/adjustments', getInventoryAdjustments)
router.get('/model/:modelId', getInventoryByModel)
router.get('/size/:euSize', getInventoryBySize)

router.post('/', createInventory)
router.post('/import', importInventory)
router.patch('/sku/:sku/stock', updateStock)
router.patch('/sku/:sku/adjust', adjustStock)
router.patch('/sku/:sku/reserve', reserveStock)
router.patch('/sku/:sku/release', releaseStock)
router.patch('/sku/:sku/damaged', markDamaged)
router.patch('/sku/:sku/meta', updateInventoryMeta)

export default router
