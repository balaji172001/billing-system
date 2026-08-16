import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  frequency: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  nextBillingDate: { type: Date, required: true },
  lastBilledDate: { type: Date },
  currency: { type: String, default: 'USD' },
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true }
  }],
  taxRate: { type: Number, default: 0 },
  discountRate: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
