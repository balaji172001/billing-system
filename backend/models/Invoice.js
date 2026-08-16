import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  currency: { type: String, default: 'USD' },
  paymentTerms: { type: String, default: 'Due on Receipt' },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true }
  }],
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountRate: { type: Number, default: 0 }, // percentage
  discountAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'unpaid', 'overdue', 'refunded'],
    default: 'draft'
  },
  notes: { type: String, default: '' },
  bankDetails: { type: String, default: '' },
  termsAndConditions: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
