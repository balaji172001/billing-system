import mongoose from 'mongoose';
import Client from './models/Client.js';
import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import Company from './models/Company.js';
import Subscription from './models/Subscription.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billing-system';

async function resetAllData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🧹 Connected to MongoDB at ${MONGODB_URI}...`);

    const clientRes = await Client.deleteMany({});
    const invoiceRes = await Invoice.deleteMany({});
    const paymentRes = await Payment.deleteMany({});
    const companyRes = await Company.deleteMany({});
    const subRes = await Subscription.deleteMany({});

    console.log('✅ ALL LOCAL DATABASE DATA REMOVED SUCCESSFULLY:');
    console.log(` - Clients deleted: ${clientRes.deletedCount}`);
    console.log(` - Invoices deleted: ${invoiceRes.deletedCount}`);
    console.log(` - Payments deleted: ${paymentRes.deletedCount}`);
    console.log(` - Company profiles deleted: ${companyRes.deletedCount}`);
    console.log(` - Subscriptions deleted: ${subRes.deletedCount}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
}

resetAllData();
