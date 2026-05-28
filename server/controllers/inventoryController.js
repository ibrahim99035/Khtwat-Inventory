import ProductModel from '../models/ProductModel.js'
import ColorVariant from '../models/ColorVariant.js'
import SizeInventory from '../models/SizeInventory.js'

const STORE_CODE = process.env.STORE_CODE || 'KHT'

const normalizeToken = (val) => String(val || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')

const buildSku = (modelId, colorCode, euSize) =>
  `${normalizeToken(STORE_CODE)}-${normalizeToken(modelId)}-${normalizeToken(colorCode)}-${String(euSize)}`

const csvEscape = (val) => {
  const str = val === null || val === undefined ? '' : String(val)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const findModelByParam = async (modelParam) => {
  const byId = await ProductModel.findById(modelParam)
  if (byId) return byId
  return ProductModel.findOne({ modelId: normalizeToken(modelParam) })
}

export const createInventory = async (req, res) => {
  try {
    const {
      variantId,
      euSize,
      usSize,
      ukSize,
      quantity = 0,
      reservedQuantity = 0,
      damagedQuantity = 0,
      warehouseLocation,
      barcode,
      status,
      lowStockAt,
      flags,
    } = req.body

    if (!variantId || euSize === undefined) {
      return res.status(400).json({ message: 'variantId and euSize are required' })
    }

    const variant = await ColorVariant.findById(variantId)
    if (!variant) return res.status(404).json({ message: 'Variant not found' })

    const model = await ProductModel.findById(variant.productModelId)
    if (!model) return res.status(404).json({ message: 'Model not found' })

    const sku = buildSku(model.modelId, variant.colorCode, euSize)

    const inventory = await SizeInventory.create({
      sku,
      variantId: variant._id,
      euSize: Number(euSize),
      usSize,
      ukSize,
      quantity: Number(quantity),
      reservedQuantity: Number(reservedQuantity),
      damagedQuantity: Number(damagedQuantity),
      warehouseLocation,
      barcode,
      status,
      lowStockAt,
      flags,
    })

    res.status(201).json(inventory)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'SKU or size already exists for this variant' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const updateStock = async (req, res) => {
  try {
    const { sku } = req.params
    const { quantity, delta } = req.body

    const inventory = await SizeInventory.findOne({ sku: normalizeToken(sku) })
    if (!inventory) return res.status(404).json({ message: 'SKU not found' })

    if (quantity === undefined && delta === undefined) {
      return res.status(400).json({ message: 'quantity or delta is required' })
    }

    if (quantity !== undefined) {
      const nextQty = Number(quantity)
      if (nextQty < inventory.reservedQuantity) {
        return res.status(400).json({ message: 'Quantity cannot be less than reserved quantity' })
      }
      inventory.quantity = nextQty
    } else {
      const nextQty = inventory.quantity + Number(delta)
      if (nextQty < inventory.reservedQuantity) {
        return res.status(400).json({ message: 'Quantity cannot be less than reserved quantity' })
      }
      inventory.quantity = nextQty
    }

    await inventory.save()
    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const reserveStock = async (req, res) => {
  try {
    const { sku } = req.params
    const { qty } = req.body

    const inventory = await SizeInventory.findOne({ sku: normalizeToken(sku) })
    if (!inventory) return res.status(404).json({ message: 'SKU not found' })

    const amount = Number(qty)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid qty' })
    }
    if (inventory.availableQuantity < amount) {
      return res.status(400).json({ message: 'Insufficient available stock' })
    }

    inventory.reservedQuantity += amount
    await inventory.save()

    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const releaseStock = async (req, res) => {
  try {
    const { sku } = req.params
    const { qty } = req.body

    const inventory = await SizeInventory.findOne({ sku: normalizeToken(sku) })
    if (!inventory) return res.status(404).json({ message: 'SKU not found' })

    const amount = Number(qty)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid qty' })
    }
    if (inventory.reservedQuantity < amount) {
      return res.status(400).json({ message: 'Release exceeds reserved quantity' })
    }

    inventory.reservedQuantity -= amount
    await inventory.save()

    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const markDamaged = async (req, res) => {
  try {
    const { sku } = req.params
    const { qty } = req.body

    const inventory = await SizeInventory.findOne({ sku: normalizeToken(sku) })
    if (!inventory) return res.status(404).json({ message: 'SKU not found' })

    const amount = Number(qty)
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid qty' })
    }
    if (inventory.availableQuantity < amount) {
      return res.status(400).json({ message: 'Insufficient available stock' })
    }

    inventory.quantity -= amount
    inventory.damagedQuantity += amount
    await inventory.save()

    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getInventoryBySku = async (req, res) => {
  try {
    const { sku } = req.params
    const inventory = await SizeInventory.findOne({ sku: normalizeToken(sku) }).lean()
    if (!inventory) return res.status(404).json({ message: 'SKU not found' })
    res.json(inventory)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getInventoryByModel = async (req, res) => {
  try {
    const { modelId } = req.params
    const model = await findModelByParam(modelId)
    if (!model) return res.status(404).json({ message: 'Model not found' })

    const variants = await ColorVariant.find({ productModelId: model._id }).select('_id').lean()
    const variantIds = variants.map(v => v._id)

    const inventory = await SizeInventory.find({ variantId: { $in: variantIds } }).lean()
    res.json({ model, inventory })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getInventoryBySize = async (req, res) => {
  try {
    const { euSize } = req.params
    const inventory = await SizeInventory.find({ euSize: Number(euSize) }).lean()
    res.json({ inventory })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getLowStock = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold)
    const query = { availableQuantity: { $gt: 0 } }
    if (Number.isFinite(threshold)) {
      query.availableQuantity = { $gt: 0, $lte: threshold }
    }
    const inventory = await SizeInventory.find(query).lean()
    res.json({ inventory })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const exportInventoryCsv = async (_, res) => {
  try {
    const inventory = await SizeInventory.find()
      .populate({ path: 'variantId', populate: { path: 'productModelId' } })
      .lean()

    const header = [
      'sku',
      'modelId',
      'colorCode',
      'colorName',
      'euSize',
      'usSize',
      'ukSize',
      'quantity',
      'reservedQuantity',
      'availableQuantity',
      'damagedQuantity',
      'warehouseLocation',
      'barcode',
      'status',
      'lowStockAt',
      'flags',
    ]

    const rows = inventory.map(item => {
      const variant = item.variantId || {}
      const model = variant.productModelId || {}
      return [
        csvEscape(item.sku),
        csvEscape(model.modelId),
        csvEscape(variant.colorCode),
        csvEscape(variant.colorName),
        csvEscape(item.euSize),
        csvEscape(item.usSize),
        csvEscape(item.ukSize),
        csvEscape(item.quantity),
        csvEscape(item.reservedQuantity),
        csvEscape(item.availableQuantity),
        csvEscape(item.damagedQuantity),
        csvEscape(item.warehouseLocation),
        csvEscape(item.barcode),
        csvEscape(item.status),
        csvEscape(item.lowStockAt),
        csvEscape(JSON.stringify(item.flags || {})),
      ]
    })

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
