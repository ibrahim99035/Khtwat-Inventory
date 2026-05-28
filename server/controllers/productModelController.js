import ProductModel from '../models/ProductModel.js'
import ColorVariant from '../models/ColorVariant.js'

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

export const listProductModels = async (_, res) => {
  try {
    const models = await ProductModel.find().lean()
    res.json({ models })
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
    const { colorName, colorCode, imageSet, thumbnail, videoAssets } = req.body

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

export const listVariantsByModel = async (req, res) => {
  try {
    const { modelId } = req.params
    const variants = await ColorVariant.find({ productModelId: modelId }).lean()
    res.json({ variants })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
