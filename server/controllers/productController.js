import ProductModel from '../models/ProductModel.js'
import ColorVariant from '../models/ColorVariant.js'
import SizeInventory from '../models/SizeInventory.js'

const computeVariantStatus = (sizes = []) => {
  const available = sizes.reduce((sum, s) => sum + Number(s.availableQuantity || 0), 0)
  const low = sizes.some(s => s.availableQuantity > 0 && s.availableQuantity <= s.lowStockAt)
  if (available === 0) return 'out'
  if (low) return 'low'
  return 'in'
}

const buildPublicModel = (model, variants, inventory) => {
  const sizesByVariant = new Map()
  for (const item of inventory) {
    const key = String(item.variantId)
    if (!sizesByVariant.has(key)) sizesByVariant.set(key, [])
    sizesByVariant.get(key).push(item)
  }

  const mappedVariants = variants.map(v => {
    const sizes = (sizesByVariant.get(String(v._id)) || [])
      .map(s => ({
        sku: s.sku,
        size: s.euSize,
        stock: s.quantity,
        available: s.availableQuantity,
        lowStockAt: s.lowStockAt,
      }))
      .sort((a, b) => a.size - b.size)

    const image = v.thumbnail?.url || v.imageSet?.[0]?.url || null

    return {
      _id: v._id,
      colorName: v.colorName,
      colorCode: v.colorCode,
      sellPrice: v.sellPrice,
      status: computeVariantStatus(sizes),
      image,
      sizes,
    }
  })

  const prices = mappedVariants.map(v => Number(v.sellPrice || 0)).filter(p => p > 0)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const priceRange = { min: minPrice, max: maxPrice }

  const heroImage = model.imageSet?.[0]?.url || mappedVariants.find(v => v.image)?.image || null

  return {
    _id: model._id,
    modelId: model.modelId,
    modelName: model.modelName,
    brand: model.brand,
    category: model.category,
    gender: model.gender,
    description: model.description,
    priceRange,
    image: heroImage,
    variants: mappedVariants,
  }
}

export const getPublicMeta = async (_, res) => {
  try {
    const [categories, brands] = await Promise.all([
      ProductModel.distinct('category'),
      ProductModel.distinct('brand'),
    ])
    res.json({
      categories: categories.filter(Boolean),
      brands: brands.filter(Boolean),
      genders: (await ProductModel.distinct('gender')).filter(Boolean),
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

    const query = {}

    if (search) {
      query.$or = [
        { modelName: { $regex: search, $options: 'i' } },
        { modelId: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }
    if (category) query.category = category
    if (brand) query.brand = brand
    if (gender) query.gender = gender

    const baseModels = await ProductModel.find(query).select('_id').lean()
    const baseModelIds = baseModels.map(m => m._id)

    const allVariants = await ColorVariant.find({ productModelId: { $in: baseModelIds } })
      .select('_id productModelId')
      .lean()
    const allVariantIds = allVariants.map(v => v._id)

    const allInventory = await SizeInventory.find({ variantId: { $in: allVariantIds } })
      .select('variantId')
      .lean()

    const variantIdsWithInventory = new Set(allInventory.map(i => String(i.variantId)))
    const modelIdsWithInventory = new Set(
      allVariants
        .filter(v => variantIdsWithInventory.has(String(v._id)))
        .map(v => String(v.productModelId))
    )

    const filteredModelIds = Array.from(modelIdsWithInventory)
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 }
    const skip = (Number(page) - 1) * Number(limit)

    const models = await ProductModel.find({ ...query, _id: { $in: filteredModelIds } })
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const modelIds = models.map(m => m._id)
    const variants = await ColorVariant.find({ productModelId: { $in: modelIds } }).lean()
    const variantIds = variants.map(v => v._id)
    const inventory = await SizeInventory.find({ variantId: { $in: variantIds } }).lean()

    const variantsByModel = new Map()
    for (const variant of variants) {
      const key = String(variant.productModelId)
      if (!variantsByModel.has(key)) variantsByModel.set(key, [])
      variantsByModel.get(key).push(variant)
    }

    const inventoryByVariant = new Map()
    for (const item of inventory) {
      const key = String(item.variantId)
      if (!inventoryByVariant.has(key)) inventoryByVariant.set(key, [])
      inventoryByVariant.get(key).push(item)
    }

    const catalog = models.map(model => {
      const modelVariants = variantsByModel.get(String(model._id)) || []
      const modelInventory = modelVariants.flatMap(v => inventoryByVariant.get(String(v._id)) || [])
      return buildPublicModel(model, modelVariants, modelInventory)
    })

    const filteredCatalog = catalog.filter(entry =>
      entry.variants.some(v => (v.sizes || []).length > 0)
    )

    const total = filteredModelIds.length

    res.json({
      products: filteredCatalog,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
