import mongoose from 'mongoose'

const AssetSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
}, { _id: false })

const ColorVariantSchema = new mongoose.Schema(
  {
    variantId: { type: String, required: true, trim: true, uppercase: true, unique: true },
    productModelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel', required: true },
    colorName: { type: String, required: true, trim: true },
    colorCode: { type: String, required: true, trim: true, uppercase: true },
    imageSet: { type: [AssetSchema], default: [] },
    thumbnail: { type: AssetSchema, default: null },
    videoAssets: { type: [AssetSchema], default: [] },
  },
  { timestamps: true }
)

ColorVariantSchema.index({ productModelId: 1, colorCode: 1 }, { unique: true })

export default mongoose.model('ColorVariant', ColorVariantSchema)
