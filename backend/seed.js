import mongoose from 'mongoose';
import Client from './models/Client.js';
import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import Company from './models/Company.js';
import Subscription from './models/Subscription.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/billing-system';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Client.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Company.deleteMany({});
    await Subscription.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Default Company settings
    const company = await Company.create({
      name: 'Nexus Tech Global Ltd',
      address: 'Suite 404, Silicon Innovation Park, Dubai, UAE',
      email: 'finance@nexustech.io',
      phone: '+971 4 123 4567',
      taxNumber: 'VAT-AE-1002394',
      currency: 'USD',
      invoicePrefix: 'NEX-',
      defaultTaxRate: 5, // UAE VAT 5%
      bankDetails: {
        bankName: 'Emirates NBD',
        accountNumber: '1029485736201',
        ifscOrSwift: 'NBDUAEAAXXX',
        accountName: 'Nexus Tech Global Ltd Accounts'
      },
      termsAndConditions: 'Please pay within 15 days of receiving this invoice. Bank transfer fees must be covered by the payer.'
    });
    console.log('Created Company Settings.');

    // 2. Create Clients
    const client1 = await Client.create({
      name: 'Acme Corporation Inc',
      email: 'billing@acme.com',
      phone: '+1 (555) 014-2821',
      address: '100 Broadway St, New York, NY 10005, USA',
      taxNumber: 'US-TAX-382910'
    });

    const client2 = await Client.create({
      name: 'Stark Enterprises',
      email: 'payments@stark.com',
      phone: '+1 (555) 982-1100',
      address: '10880 Wilshire Blvd, Los Angeles, CA 90024, USA',
      taxNumber: 'US-TAX-998822'
    });

    const client3 = await Client.create({
      name: 'Cyberdyne Systems LLC',
      email: 'accounts@cyberdyne.jp',
      phone: '+81 3 5555 0192',
      address: 'Chiyoda-ku, Tokyo, Japan',
      taxNumber: 'JP-VAT-123490'
    });

    const client4 = await Client.create({
      name: 'Weyland-Yutani Corp',
      email: 'invoice@weyland.com',
      phone: '+44 20 7946 0958',
      address: '25 Fenchurch St, London, UK',
      taxNumber: 'UK-VAT-8849302'
    });
    console.log('Created Clients.');

    // Helpers for dates
    const getPastDate = (monthsAgo, day) => {
      const d = new Date();
      d.setMonth(d.getMonth() - monthsAgo);
      if (day !== undefined) d.setDate(day);
      return d;
    };

    // 3. Create Invoices and payments
    // Invoice 1: Acme, paid, 5 months ago
    const inv1 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0001',
      client: client1._id,
      issueDate: getPastDate(5, 5),
      dueDate: getPastDate(5, 20),
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'Cloud Infrastructure Migration Strategy', quantity: 1, unitPrice: 3500, total: 3500 },
        { description: 'Docker & Kubernetes Training Workshop', quantity: 2, unitPrice: 1250, total: 2500 }
      ],
      taxRate: 5,
      taxAmount: 300,
      discountRate: 0,
      discountAmount: 0,
      subtotal: 6000,
      grandTotal: 6300,
      amountPaid: 6300,
      status: 'paid',
      notes: 'Full payment received. Thank you.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    await Payment.create({
      invoice: inv1._id,
      amount: 6300,
      date: getPastDate(5, 18),
      method: 'bank',
      transactionId: 'TXN-902384102',
      notes: 'Wire transfer payment'
    });

    // Invoice 2: Stark, paid, 4 months ago
    const inv2 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0002',
      client: client2._id,
      issueDate: getPastDate(4, 10),
      dueDate: getPastDate(4, 25),
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'Arc Reactor Integration Consultancy', quantity: 1, unitPrice: 8500, total: 8500 }
      ],
      taxRate: 5,
      taxAmount: 425,
      discountRate: 10, // 10% discount
      discountAmount: 850,
      subtotal: 8500,
      grandTotal: 8075,
      amountPaid: 8075,
      status: 'paid',
      notes: 'Special promo discount applied.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    await Payment.create({
      invoice: inv2._id,
      amount: 8075,
      date: getPastDate(4, 22),
      method: 'bank',
      transactionId: 'TXN-773820491',
      notes: 'EFT Wire'
    });

    // Invoice 3: Cyberdyne, partially paid, 3 months ago
    const inv3 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0003',
      client: client3._id,
      issueDate: getPastDate(3, 12),
      dueDate: getPastDate(3, 27),
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'Neural Network Architecture Optimization', quantity: 1, unitPrice: 5000, total: 5000 },
        { description: 'Support Retainer (Q1)', quantity: 3, unitPrice: 1500, total: 4500 }
      ],
      taxRate: 5,
      taxAmount: 475,
      discountRate: 0,
      discountAmount: 0,
      subtotal: 9500,
      grandTotal: 9975,
      amountPaid: 6000,
      status: 'partially_paid',
      notes: 'First installment of 6,000 paid. Balance remaining.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    await Payment.create({
      invoice: inv3._id,
      amount: 6000,
      date: getPastDate(3, 26),
      method: 'bank',
      transactionId: 'TXN-884910239',
      notes: 'Partial payment wire'
    });

    // Invoice 4: Weyland, paid, 2 months ago
    const inv4 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0004',
      client: client4._id,
      issueDate: getPastDate(2, 1),
      dueDate: getPastDate(2, 16),
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'Biometric Sensor Node Design Services', quantity: 1, unitPrice: 4200, total: 4200 }
      ],
      taxRate: 5,
      taxAmount: 210,
      discountRate: 5,
      discountAmount: 210,
      subtotal: 4200,
      grandTotal: 4200,
      amountPaid: 4200,
      status: 'paid',
      notes: 'Paid via corporate credit card.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    await Payment.create({
      invoice: inv4._id,
      amount: 4200,
      date: getPastDate(2, 14),
      method: 'card',
      transactionId: 'TXN-556633221',
      notes: 'CC online payment'
    });

    // Invoice 5: Stark, unpaid (due in past, i.e., overdue)
    const inv5 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0005',
      client: client2._id,
      issueDate: getPastDate(1, 1),
      dueDate: getPastDate(1, 16), // Overdue
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'Vibranium Coating R&D Software Suite', quantity: 1, unitPrice: 12000, total: 12000 }
      ],
      taxRate: 5,
      taxAmount: 600,
      discountRate: 0,
      discountAmount: 0,
      subtotal: 12000,
      grandTotal: 12600,
      amountPaid: 0,
      status: 'unpaid',
      notes: 'Awaiting purchase order reconciliation.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    // Invoice 6: Acme, sent (due in future)
    const issueDateFuture = new Date();
    issueDateFuture.setDate(issueDateFuture.getDate() - 2);
    const dueDateFuture = new Date();
    dueDateFuture.setDate(dueDateFuture.getDate() + 13);

    const inv6 = await Invoice.create({
      invoiceNumber: 'NEX-2026-0006',
      client: client1._id,
      issueDate: issueDateFuture,
      dueDate: dueDateFuture,
      currency: 'USD',
      paymentTerms: 'Net 15',
      lineItems: [
        { description: 'SaaS Monthly Operations Retainer', quantity: 1, unitPrice: 2500, total: 2500 },
        { description: 'UX Audit & Consulting hours', quantity: 5, unitPrice: 150, total: 750 }
      ],
      taxRate: 5,
      taxAmount: 162.5,
      discountRate: 0,
      discountAmount: 0,
      subtotal: 3250,
      grandTotal: 3412.5,
      amountPaid: 0,
      status: 'sent',
      notes: 'Sent via automated reminder service.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    // Invoice 7: Cyberdyne, draft (created today)
    await Invoice.create({
      invoiceNumber: 'NEX-2026-0007',
      client: client3._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      paymentTerms: 'Due on Receipt',
      lineItems: [
        { description: 'Hardware Interface Driver Integration', quantity: 1, unitPrice: 4800, total: 4800 }
      ],
      taxRate: 5,
      taxAmount: 240,
      discountRate: 0,
      discountAmount: 0,
      subtotal: 4800,
      grandTotal: 5040,
      amountPaid: 0,
      status: 'draft',
      notes: 'Draft workspace, waiting for project completion review.',
      bankDetails: 'Emirates NBD A/C: 1029485736201',
      termsAndConditions: company.termsAndConditions
    });

    console.log('Created Invoice Records & Payments.');

    // 4. Create recurring billing subscriptions
    const subNextDate = new Date();
    subNextDate.setDate(subNextDate.getDate() + 5); // due in 5 days
    
    await Subscription.create({
      client: client1._id,
      title: 'Enterprise Server Maintenance Plan',
      amount: 1500,
      frequency: 'monthly',
      status: 'active',
      nextBillingDate: subNextDate,
      lineItems: [{ description: 'Enterprise Server Maintenance Retainer', quantity: 1, unitPrice: 1500, total: 1500 }],
      taxRate: 5,
      discountRate: 0
    });

    await Subscription.create({
      client: client3._id,
      title: 'Monthly DevOps Retainer',
      amount: 3000,
      frequency: 'monthly',
      status: 'active',
      nextBillingDate: subNextDate,
      lineItems: [{ description: 'Monthly DevOps Support Retainer', quantity: 1, unitPrice: 3000, total: 3000 }],
      taxRate: 5,
      discountRate: 5
    });

    await Subscription.create({
      client: client4._id,
      title: 'Yearly Security Core Assessment',
      amount: 12000,
      frequency: 'yearly',
      status: 'paused',
      nextBillingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // in 3 months
      lineItems: [{ description: 'Yearly Pentest & Security Assessment', quantity: 1, unitPrice: 12000, total: 12000 }],
      taxRate: 5,
      discountRate: 0
    });

    console.log('Created Subscription Records.');

    console.log('Database Seeding Successful!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding database:', err);
    await mongoose.disconnect();
  }
}

seed();
