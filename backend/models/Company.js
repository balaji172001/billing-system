import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  taxNumber: { type: String, default: '' }, // GST/VAT ID
  currency: { type: String, default: 'USD' },
  invoicePrefix: { type: String, default: 'INV-' },
  defaultTaxRate: { type: Number, default: 0 },
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscOrSwift: { type: String, default: '' },
    accountName: { type: String, default: '' }
  },
  termsAndConditions: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
