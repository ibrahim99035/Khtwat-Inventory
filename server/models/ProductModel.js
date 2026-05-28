import mongoose from 'mongoose'

const ProductModelSchema = new mongoose.Schema(
  {
    modelId: { type: String, required: true, trim: true, uppercase: true, unique: true },
    brand: { type: String, trim: true },
    modelName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    description: { type: String, trim: true },
    material: { type: String, trim: true },
    costPrice: { type: Number, min: 0, default: 0 },
    sellPrice: { type: Number, min: 0, default: 0 },
    tags: { type: [String], default: [] },
    supplier: { type: String, trim: true },
    releaseSeason: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('ProductModel', ProductModelSchema)
