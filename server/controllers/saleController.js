import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import SizeInventory from '../models/SizeInventory.js'
import ColorVariant from '../models/ColorVariant.js'
import ProductModel from '../models/ProductModel.js'

const toNumber = (val, fallback = 0) => {
  const num = Number(val)
  return Number.isFinite(num) ? num : fallback
}

const normalizeToken = (val) => String(val || '')
  .toUpperCase()
  .replace(/[^A-Z0-9-]/g, '')

const computeSaleTotals = (items, discount = 0, tax = 0) => {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const total = Math.max(subtotal - discount + tax, 0)
  return { subtotal, total }
}

const computeReturnedMap = (returns = []) => {
  const map = {}
  for (const ret of returns) {
    for (const item of ret.items || []) {
      const key = String(item.lineId)
      map[key] = (map[key] || 0) + item.qty
    }
  }
  return map
}

const refreshSaleStatus = (sale) => {
  sale.balance = Math.max(sale.total - sale.paidAmount - sale.refundedAmount, 0)

  if (sale.refundedAmount > 0) {
    sale.paymentStatus = sale.balance <= 0 ? 'refunded' : 'partially_refunded'
  } else if (sale.paidAmount <= 0) {
    sale.paymentStatus = 'unpaid'
  } else if (sale.balance <= 0) {
    sale.paymentStatus = 'paid'
  } else {
    sale.paymentStatus = 'partial'
  }

  const returnedMap = computeReturnedMap(sale.returns)
  const allReturned = sale.items.length > 0 && sale.items.every(item => {
    const returnedQty = returnedMap[String(item._id)] || 0
    return returnedQty >= item.qty
  })
  const anyReturned = sale.items.some(item => {
    const returnedQty = returnedMap[String(item._id)] || 0
    return returnedQty > 0
  })

  if (allReturned) sale.status = 'returned'
  else if (anyReturned) sale.status = 'partially_returned'
  else sale.status = sale.paymentStatus === 'paid' ? 'completed' : 'open'

  if (sale.paymentStatus === 'paid') {
    sale.customerName = undefined
    sale.customerPhone = undefined
  }
}

export const getSales = async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      from,
      to,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ]
    }

    if (status) query.status = status
    if (paymentStatus) query.paymentStatus = paymentStatus

    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (Number(page) - 1) * Number(limit)

    const sales = await Sale.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const total = await Sale.countDocuments(query)

    res.json({
      sales,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).lean()
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    res.json(sale)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createSale = async (req, res) => {
  try {
    const { items, discount = 0, tax = 0, paidAmount = 0, paymentMethod, customer } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required' })
    }

    const normalizedItems = []

    for (const item of items) {
      const qty = toNumber(item.qty)
      if (qty <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity' })
      }

      if (item.sku) {
        const sku = normalizeToken(item.sku)
        const inventory = await SizeInventory.findOne({ sku })
        if (!inventory) return res.status(404).json({ message: 'SKU not found' })

        if (inventory.availableQuantity < qty) {
          return res.status(400).json({ message: 'Insufficient available stock for SKU ' + sku })
        }

        inventory.quantity -= qty
        await inventory.save()

        const variant = await ColorVariant.findById(inventory.variantId)
        const model = variant ? await ProductModel.findById(variant.productModelId) : null

        const unitPrice = toNumber(item.unitPrice, model?.sellPrice)
        if (unitPrice <= 0) {
          return res.status(400).json({ message: 'Unit price is required for SKU items' })
        }

        const lineTotal = unitPrice * qty

        normalizedItems.push({
          sku,
          modelId: model?._id,
          variantId: inventory.variantId,
          size: String(inventory.euSize),
          euSize: inventory.euSize,
          qty,
          unitPrice,
          lineTotal,
        })
      } else {
        if (!item.productId || !item.variantId || !item.size) {
          return res.status(400).json({ message: 'Invalid item data' })
        }

        const product = await Product.findById(item.productId)
        if (!product) return res.status(404).json({ message: 'Product not found' })

        const variant = product.variants.id(item.variantId)
        if (!variant) return res.status(404).json({ message: 'Variant not found' })

        const sizeEntry = variant.sizes.find(s => s.size === item.size)
        if (!sizeEntry) return res.status(404).json({ message: 'Size not found' })

        if (sizeEntry.stock < qty) {
          return res.status(400).json({ message: 'Insufficient stock for size ' + item.size })
        }

        sizeEntry.stock -= qty
        await product.save()

        const unitPrice = toNumber(item.unitPrice, variant.sellPrice)
        const lineTotal = unitPrice * qty

        normalizedItems.push({
          productId: product._id,
          variantId: variant._id,
          size: item.size,
          qty,
          unitPrice,
          lineTotal,
        })
      }
    }

    const { total } = computeSaleTotals(normalizedItems, toNumber(discount), toNumber(tax))
    const paid = toNumber(paidAmount)

    if (paid > total) {
      return res.status(400).json({ message: 'Paid amount cannot exceed total' })
    }

    const paymentStatus = paid <= 0
      ? 'unpaid'
      : paid >= total
        ? 'paid'
        : 'partial'

    if (paymentStatus !== 'paid') {
      if (!customer?.name || !customer?.phone) {
        return res.status(400).json({ message: 'Customer name and phone are required' })
      }
    }

    const sale = new Sale({
      items: normalizedItems,
      discount: toNumber(discount),
      tax: toNumber(tax),
      total,
      paidAmount: paid,
      refundedAmount: 0,
      balance: Math.max(total - paid, 0),
      paymentStatus,
      status: paymentStatus === 'paid' ? 'completed' : 'open',
      customerName: paymentStatus === 'paid' ? undefined : customer?.name,
      customerPhone: paymentStatus === 'paid' ? undefined : customer?.phone,
      payments: paid > 0
        ? [{ amount: paid, method: paymentMethod || 'cash' }]
        : [],
    })

    await sale.save()
    res.status(201).json(sale)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const addPayment = async (req, res) => {
  try {
    const { amount, method, note } = req.body
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })

    const amt = toNumber(amount)
    if (amt <= 0) return res.status(400).json({ message: 'Invalid amount' })

    const maxPayable = Math.max(sale.total - sale.refundedAmount, 0)
    if (sale.paidAmount >= maxPayable) {
      return res.status(400).json({ message: 'Sale is already settled' })
    }

    if (sale.paidAmount + amt > maxPayable) {
      return res.status(400).json({ message: 'Payment exceeds remaining balance' })
    }

    sale.paidAmount += amt
    sale.payments.push({ amount: amt, method: method || 'cash', note })

    refreshSaleStatus(sale)
    await sale.save()

    res.json(sale)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createReturn = async (req, res) => {
  try {
    const { items, method, note } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Return items are required' })
    }

    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })

    const returnedMap = computeReturnedMap(sale.returns)
    let refundTotal = 0
    const normalized = []

    for (const item of items) {
      const qty = toNumber(item.qty)
      if (!item.lineId || qty <= 0) {
        return res.status(400).json({ message: 'Invalid return item data' })
      }

      const line = sale.items.id(item.lineId)
      if (!line) return res.status(404).json({ message: 'Line item not found' })

      const alreadyReturned = returnedMap[String(item.lineId)] || 0
      const remaining = line.qty - alreadyReturned

      if (qty > remaining) {
        return res.status(400).json({ message: 'Return qty exceeds remaining' })
      }

      const condition = item.condition || 'resellable'
      if (condition === 'resellable') {
        if (line.sku) {
          const inventory = await SizeInventory.findOne({ sku: normalizeToken(line.sku) })
          if (inventory) {
            inventory.quantity += qty
            await inventory.save()
          }
        } else if (line.productId) {
          const product = await Product.findById(line.productId)
          if (product) {
            const variant = product.variants.id(line.variantId)
            const sizeEntry = variant?.sizes.find(s => s.size === line.size)
            if (sizeEntry) {
              sizeEntry.stock += qty
              await product.save()
            }
          }
        }
      }

      refundTotal += line.unitPrice * qty
      normalized.push({
        lineId: line._id,
        qty,
        condition,
      })
    }

    sale.refundedAmount += refundTotal
    sale.returns.push({
      items: normalized,
      refundAmount: refundTotal,
      method: method || 'cash',
      note,
    })

    refreshSaleStatus(sale)
    await sale.save()

    res.json(sale)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
