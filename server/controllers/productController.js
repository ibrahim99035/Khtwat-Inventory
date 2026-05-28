import Product from '../models/Product.js'
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload.js'

const variantStats = (variant) => {
  const totalStock = variant.sizes.reduce((s, sz) => s + sz.stock, 0)
  const profit = variant.sellPrice - variant.costPrice
  const margin = variant.sellPrice > 0
    ? Math.round((profit / variant.sellPrice) * 100)
    : 0

  let stockStatus = 'in'
  if (totalStock === 0) stockStatus = 'out'
  else if (variant.sizes.some(sz => sz.stock <= variant.lowStockAt && sz.stock > 0)) {
    stockStatus = 'low'
  }

  return { totalStock, profit, margin, stockStatus }
}

const csvEscape = (val) => {
  const str = val === null || val === undefined ? '' : String(val)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const sanitizePublicProduct = (product) => {
  const variants = (product.variants || []).map(v => ({
    _id: v._id,
    sku: v.sku,
    color: v.color,
    colorHex: v.colorHex,
    sellPrice: v.sellPrice,
    sizes: (v.sizes || []).map(sz => ({
      size: sz.size,
      stock: sz.stock,
    })),
  }))

  return {
    _id: product._id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
    gender: product.gender,
    available: product.available,
    images: product.images || [],
    variants,
  }
}

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      gender,
      available,
      status,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query

    const query = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ]
    }
    if (category) query.category = category
    if (brand) query.brand = brand
    if (gender) query.gender = gender
    if (available !== undefined && available !== '') query.available = available === 'true'

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (Number(page) - 1) * Number(limit)

    let products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    if (status) {
      products = products.filter(p => {
        const statuses = p.variants.map(v => variantStats(v).stockStatus)
        if (status === 'out') return statuses.every(s => s === 'out')
        if (status === 'low') return statuses.some(s => s === 'low')
        if (status === 'in') return statuses.some(s => s === 'in')
        return true
      })
    }

    const total = await Product.countDocuments(query)

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMeta = async (_, res) => {
  try {
    const [categories, brands] = await Promise.all([
      Product.distinct('category'),
      Product.distinct('brand'),
    ])
    res.json({
      categories: categories.filter(Boolean),
      brands: brands.filter(Boolean),
      genders: (await Product.distinct('gender')).filter(Boolean),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getPublicMeta = async (_, res) => {
  try {
    const [categories, brands] = await Promise.all([
      Product.distinct('category', { available: true }),
      Product.distinct('brand', { available: true }),
    ])
    res.json({
      categories: categories.filter(Boolean),
      brands: brands.filter(Boolean),
      genders: (await Product.distinct('gender', { available: true })).filter(Boolean),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getPublicProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      gender,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 24,
    } = req.query

    const query = { available: true }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ]
    }
    if (category) query.category = category
    if (brand) query.brand = brand
    if (gender) query.gender = gender

    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (Number(page) - 1) * Number(limit)

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const sanitized = products.map(sanitizePublicProduct)

    const total = await Product.countDocuments(query)

    res.json({
      products: sanitized,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getStats = async (_, res) => {
  try {
    const products = await Product.find().lean()

    let totalSkus = 0
    let stockValue = 0
    let potRevenue = 0
    let alertCount = 0

    for (const p of products) {
      for (const v of p.variants) {
        totalSkus++
        const { totalStock, stockStatus } = variantStats(v)
        stockValue += v.costPrice * totalStock
        potRevenue += v.sellPrice * totalStock
        if (stockStatus !== 'in') alertCount++
      }
    }

    res.json({
      totalProducts: products.length,
      totalSkus,
      stockValue,
      potRevenue,
      potProfit: potRevenue - stockValue,
      alertCount,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, brand, category, description, notes, gender, available, variants } = req.body

    const images = []
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer)
        images.push(result)
      }
    }

    const parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants

    const product = await Product.create({
      name,
      brand,
      category,
      description,
      notes,
      gender,
      available: available !== undefined ? available === 'true' || available === true : true,
      images,
      variants: parsedVariants || [],
    })

    res.status(201).json(product)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A variant SKU already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const { name, brand, category, description, notes, gender, available, variants, removeImages } = req.body

    if (name) product.name = name
    if (brand) product.brand = brand
    if (category) product.category = category
    if (description) product.description = description
    if (notes) product.notes = notes
    if (gender) product.gender = gender
    if (available !== undefined) {
      product.available = available === 'true' || available === true
    }

    if (removeImages) {
      const ids = typeof removeImages === 'string' ? JSON.parse(removeImages) : removeImages
      for (const publicId of ids) {
        await deleteFromCloudinary(publicId)
      }
      product.images = product.images.filter(img => !ids.includes(img.publicId))
    }

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer)
        product.images.push(result)
      }
    }

    if (variants) {
      const parsed = typeof variants === 'string' ? JSON.parse(variants) : variants
      product.variants = parsed
    }

    await product.save()
    res.json(product)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'A variant SKU already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const updateSizeStock = async (req, res) => {
  try {
    const { id, variantId, size } = req.params
    const { stock } = req.body

    const product = await Product.findById(id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const variant = product.variants.id(variantId)
    if (!variant) return res.status(404).json({ message: 'Variant not found' })

    const sizeEntry = variant.sizes.find(s => s.size === size)
    if (!sizeEntry) return res.status(404).json({ message: 'Size not found' })

    sizeEntry.stock = Number(stock)
    await product.save()

    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    for (const img of product.images) {
      await deleteFromCloudinary(img.publicId)
    }

    await product.deleteOne()
    res.json({ message: 'Product deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body
    const products = await Product.find({ _id: { $in: ids } })

    for (const p of products) {
      for (const img of p.images) {
        await deleteFromCloudinary(img.publicId)
      }
      await p.deleteOne()
    }

    res.json({ message: `${products.length} products deleted` })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const importProducts = async (req, res) => {
  try {
    const { products, overwrite = false } = req.body

    let created = 0
    let updated = 0
    let skipped = 0

    for (const p of products) {
      const existing = await Product.findOne({
        'variants.sku': { $in: (p.variants || []).map(v => v.sku) }
      })

      if (existing) {
        if (overwrite) {
          await existing.updateOne(p)
          updated++
        } else {
          skipped++
        }
      } else {
        await Product.create(p)
        created++
      }
    }

    res.json({ created, updated, skipped })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const exportProducts = async (_, res) => {
  try {
    const products = await Product.find().lean()

    const header = [
      'name',
      'brand',
      'category',
      'description',
      'notes',
      'gender',
      'available',
      'images',
      'variants',
    ]

    const rows = products.map(p => [
      csvEscape(p.name),
      csvEscape(p.brand),
      csvEscape(p.category),
      csvEscape(p.description),
      csvEscape(p.notes),
      csvEscape(p.gender),
      csvEscape(p.available),
      csvEscape(JSON.stringify(p.images || [])),
      csvEscape(JSON.stringify(p.variants || [])),
    ])

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
