import mongoose from 'mongoose'

const SizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
}, { _id: false })

const VariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  color: { type: String, required: true },
  colorHex: { type: String, trim: true },
  costPrice: { type: Number, required: true, min: 0 },
  sellPrice: { type: Number, required: true, min: 0 },
  lowStockAt: { type: Number, default: 5 },
  sizes: { type: [SizeStockSchema], default: [] },
})

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false })

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    available: { type: Boolean, default: true },
    images: { type: [ImageSchema], default: [] },
    variants: { type: [VariantSchema], default: [] },
  },
  { timestamps: true }
)

ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true })

export default mongoose.model('Product', ProductSchema)
