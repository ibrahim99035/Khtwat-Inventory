import mongoose from 'mongoose'

const InventoryAdjustmentSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColorVariant', required: true },
  euSize: { type: Number, required: true },
  delta: { type: Number, required: true }, // e.g., +5 or -2
  previousQuantity: { type: Number, required: true },
  nextQuantity: { type: Number, required: true },
  reason: { 
    type: String, 
    enum: ['restock', 'return', 'damage', 'transfer', 'audit', 'sale_correction', 'sale', 'other'],
    default: 'other' 
  },
  note: String,
  actor: String, // User ID or system process
}, { timestamps: true })

export default mongoose.model('InventoryAdjustment', InventoryAdjustmentSchema)