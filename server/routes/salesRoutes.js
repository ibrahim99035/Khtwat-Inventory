import { Router } from 'express'
import {
  getSales,
  getSale,
  createSale,
  addPayment,
  createReturn,
} from '../controllers/saleController.js'
import auth from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/', getSales)
router.get('/:id', getSale)
router.post('/', createSale)
router.post('/:id/payments', addPayment)
router.post('/:id/returns', createReturn)

export default router
