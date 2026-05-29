import ProductModel from '../models/ProductModel.js'
import ColorVariant from '../models/ColorVariant.js'
import SizeInventory from '../models/SizeInventory.js'
import { uploadToCloudinary } from '../middleware/upload.js'

const normalizeToken = (val) => String(val || '')
  .toUpperCase()
  .replace(/[^A-Z0-9]/g, '')

const buildVariantId = (modelId, colorCode) =>
  `${normalizeToken(modelId)}-${normalizeToken(colorCode)}`

export const createProductModel = async (req, res) => {
  try {
    const {
      modelId,
      brand,
      modelName,
      category,
      gender,
      description,
      material,
      costPrice,
      sellPrice,
      imageSet,
      tags,
      supplier,
      releaseSeason,
    } = req.body

    if (!modelId || !modelName) {
      return res.status(400).json({ message: 'modelId and modelName are required' })
    }

    const productModel = await ProductModel.create({
      modelId: normalizeToken(modelId),
      brand,
      modelName,
      category,
      gender,
      description,
      material,
      costPrice,
      sellPrice,
      imageSet: imageSet || [],
      tags,
      supplier,
      releaseSeason,
    })

    res.status(201).json(productModel)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Model ID already exists' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const listProductModels = async (req, res) => {
  try {
    const models = await ProductModel.aggregate([
      {
        $lookup: {
          from: 'colorvariants',
          localField: '_id',
          foreignField: 'productModelId',
          as: 'variants'
        }
      },
      {
        $lookup: {
          from: 'sizeinventories',
          localField: 'variants._id',
          foreignField: 'variantId',
          as: 'inventory'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    res.json({ models });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const uploadModelImages = async (req, res) => {
  try {
    const files = req.files || []
    if (!files.length) {
      return res.status(400).json({ message: 'No images provided' })
    }

    const folder = req.body?.folder || 'shoe-inventory'
    const assets = await Promise.all(
      files.map(file => uploadToCloudinary(file.buffer, folder))
    )

    res.json({ assets })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getProductModel = async (req, res) => {
  try {
    const model = await ProductModel.findById(req.params.id).lean()
    if (!model) return res.status(404).json({ message: 'Model not found' })
    res.json(model)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const createColorVariant = async (req, res) => {
  try {
    const { modelId } = req.params
    const {
      colorName,
      colorCode,
      costPrice,
      sellPrice,
      imageSet,
      thumbnail,
      videoAssets,
    } = req.body

    if (!colorName || !colorCode) {
      return res.status(400).json({ message: 'colorName and colorCode are required' })
    }

    const model = await ProductModel.findById(modelId)
    if (!model) return res.status(404).json({ message: 'Model not found' })

    const variantId = buildVariantId(model.modelId, colorCode)

    const variant = await ColorVariant.create({
      variantId,
      productModelId: model._id,
      colorName,
      colorCode: normalizeToken(colorCode),
      costPrice,
      sellPrice,
      imageSet: imageSet || [],
      thumbnail: thumbnail || null,
      videoAssets: videoAssets || [],
    })

    res.status(201).json(variant)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Variant already exists for this color code' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const updateProductModel = async (req, res) => {
  try {
    const model = await ProductModel.findById(req.params.id)
    if (!model) return res.status(404).json({ message: 'Model not found' })

    const {
      brand,
      modelName,
      category,
      gender,
      description,
      material,
      costPrice,
      sellPrice,
      imageSet,
      tags,
      supplier,
      releaseSeason,
    } = req.body

    if (brand !== undefined) model.brand = brand
    if (modelName !== undefined) model.modelName = modelName
    if (category !== undefined) model.category = category
    if (gender !== undefined) model.gender = gender
    if (description !== undefined) model.description = description
    if (material !== undefined) model.material = material
    if (costPrice !== undefined) model.costPrice = costPrice
    if (sellPrice !== undefined) model.sellPrice = sellPrice
    if (imageSet !== undefined) model.imageSet = imageSet
    if (tags !== undefined) model.tags = tags
    if (supplier !== undefined) model.supplier = supplier
    if (releaseSeason !== undefined) model.releaseSeason = releaseSeason

    await model.save()
    res.json(model)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateColorVariant = async (req, res) => {
  try {
    const { modelId, variantId } = req.params
    const model = await ProductModel.findById(modelId)
    if (!model) return res.status(404).json({ message: 'Model not found' })

    const variant = await ColorVariant.findById(variantId)
    if (!variant || String(variant.productModelId) !== String(model._id)) {
      return res.status(404).json({ message: 'Variant not found' })
    }

    const {
      colorName,
      colorCode,
      costPrice,
      sellPrice,
      imageSet,
      thumbnail,
      videoAssets,
    } = req.body

    if (colorName !== undefined) variant.colorName = colorName
    if (colorCode !== undefined) {
      const nextCode = normalizeToken(colorCode)
      if (nextCode !== variant.colorCode) {
        const hasInventory = await SizeInventory.exists({ variantId: variant._id })
        if (hasInventory) {
          return res.status(400).json({
            message: 'Cannot change color code once inventory exists for this variant',
          })
        }
        variant.colorCode = nextCode
        variant.variantId = buildVariantId(model.modelId, nextCode)
      }
    }
    if (costPrice !== undefined) variant.costPrice = costPrice
    if (sellPrice !== undefined) variant.sellPrice = sellPrice
    if (imageSet !== undefined) variant.imageSet = imageSet
    if (thumbnail !== undefined) variant.thumbnail = thumbnail
    if (videoAssets !== undefined) variant.videoAssets = videoAssets

    await variant.save()
    res.json(variant)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Variant already exists for this color code' })
    }
    res.status(500).json({ message: err.message })
  }
}

export const listVariantsByModel = async (req, res) => {
  try {
    const { modelId } = req.params
    const variants = await ColorVariant.find({ productModelId: modelId }).lean()
    res.json({ variants })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
