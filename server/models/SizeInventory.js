import mongoose from 'mongoose'

const FlagsSchema = new mongoose.Schema({
  lowStock: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  deadStock: { type: Boolean, default: false },
  fastSelling: { type: Boolean, default: false },
  highMargin: { type: Boolean, default: false },
  requiresRestock: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
}, { _id: false })

const SizeInventorySchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColorVariant', required: true },
    euSize: { type: Number, required: true, min: 15, max: 55 },
    usSize: { type: Number, min: 1, max: 20 },
    ukSize: { type: Number, min: 1, max: 20 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    reservedQuantity: { type: Number, min: 0, default: 0 },
    availableQuantity: { type: Number, min: 0, default: 0 },
    damagedQuantity: { type: Number, min: 0, default: 0 },
    warehouseLocation: { type: String, trim: true },
    barcode: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    lowStockAt: { type: Number, min: 0, default: 5 },
    flags: { type: FlagsSchema, default: () => ({}) },
  },
  { timestamps: true }
)

SizeInventorySchema.index({ variantId: 1, euSize: 1 }, { unique: true })

SizeInventorySchema.pre('validate', function (next) {
  if (this.quantity < 0 || this.reservedQuantity < 0 || this.damagedQuantity < 0) {
    return next(new Error('Quantities cannot be negative'))
  }
  if (this.reservedQuantity > this.quantity) {
    return next(new Error('Reserved quantity cannot exceed quantity'))
  }
  const available = this.quantity - this.reservedQuantity
  if (available < 0) {
    return next(new Error('Available quantity cannot be negative'))
  }
  this.availableQuantity = available
  return next()
})

export default mongoose.model('SizeInventory', SizeInventorySchema)
