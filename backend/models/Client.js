import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  taxNumber: { type: String, default: '' } // VAT/GST ID
}, { timestamps: true });

export default mongoose.model('Client', clientSchema);
