import mongoose from 'mongoose'

const SaleItemSchema = new mongoose.Schema({
  sku: { type: String, trim: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductModel' },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  size: { type: String, required: true },
  euSize: { type: Number },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
}, { _id: true })

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['cash', 'card'], default: 'cash' },
  note: { type: String, trim: true },
}, { timestamps: true })

const ReturnItemSchema = new mongoose.Schema({
  lineId: { type: mongoose.Schema.Types.ObjectId, required: true },
  qty: { type: Number, required: true, min: 1 },
  condition: { type: String, enum: ['resellable', 'damaged', 'used'], default: 'resellable' },
}, { _id: false })

const ReturnSchema = new mongoose.Schema({
  items: { type: [ReturnItemSchema], default: [] },
  refundAmount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['cash', 'card', 'credit'], default: 'cash' },
  note: { type: String, trim: true },
}, { timestamps: true })

const SaleSchema = new mongoose.Schema({
  items: { type: [SaleItemSchema], default: [] },
  total: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  paidAmount: { type: Number, default: 0, min: 0 },
  refundedAmount: { type: Number, default: 0, min: 0 },
  balance: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['open', 'completed', 'returned', 'partially_returned', 'canceled'],
    default: 'open',
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded', 'partially_refunded'],
    default: 'unpaid',
  },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  payments: { type: [PaymentSchema], default: [] },
  returns: { type: [ReturnSchema], default: [] },
  note: { type: String, trim: true },
}, { timestamps: true })

export default mongoose.model('Sale', SaleSchema)
