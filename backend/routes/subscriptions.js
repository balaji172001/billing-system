import express from 'express';
import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Company from '../models/Company.js';

const router = express.Router();

// Get all subscriptions
router.get('/', async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('client').sort({ createdAt: -1 });
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new subscription
router.post('/', async (req, res) => {
  try {
    const { client, title, amount, frequency, nextBillingDate, lineItems, taxRate, discountRate } = req.body;

    const sub = new Subscription({
      client,
      title,
      amount: Number(amount),
      frequency: frequency || 'monthly',
      nextBillingDate: nextBillingDate || new Date(),
      lineItems: lineItems || [{ description: title, quantity: 1, unitPrice: amount, total: amount }],
      taxRate: taxRate || 0,
      discountRate: discountRate || 0
    });

    const newSub = await sub.save();
    await newSub.populate('client');
    res.status(201).json(newSub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Subscription status
router.put('/:id', async (req, res) => {
  try {
    const updatedSub = await Subscription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('client');
    if (!updatedSub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(updatedSub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Helper to auto-generate Invoice Number
async function getNextInvoiceNumber() {
  const company = await Company.findOne();
  const prefix = company ? company.invoicePrefix : 'INV-';
  const year = new Date().getFullYear();
  const regex = new RegExp(`^${prefix}${year}-`);
  const latestInvoice = await Invoice.findOne({ invoiceNumber: regex }).sort({ invoiceNumber: -1 });
  let nextSeq = 1;
  if (latestInvoice) {
    const parts = latestInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  return `${prefix}${year}-${String(nextSeq).padStart(4, '0')}`;
}

// Trigger subscription billing manual run (mock auto-generate)
router.post('/:id/trigger', async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id).populate('client');
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (sub.status !== 'active') return res.status(400).json({ message: 'Subscription is not active' });

    const company = await Company.findOne();

    // Create a new Invoice from subscription template
    const invoiceNumber = await getNextInvoiceNumber();
    
    // Calculate total
    let subtotal = 0;
    const items = sub.lineItems.map(item => {
      const total = Number(item.quantity) * Number(item.unitPrice);
      subtotal += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total
      };
    });

    const discountAmount = (subtotal * (sub.discountRate || 0)) / 100;
    const taxableSubtotal = subtotal - discountAmount;
    const taxAmount = (taxableSubtotal * (sub.taxRate || 0)) / 100;
    const grandTotal = taxableSubtotal + taxAmount;

    // Due date (default 15 days from issue)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = new Invoice({
      invoiceNumber,
      client: sub.client._id,
      issueDate: new Date(),
      dueDate,
      currency: sub.currency || 'USD',
      paymentTerms: 'Due in 15 days',
      lineItems: items,
      taxRate: sub.taxRate,
      taxAmount,
      discountRate: sub.discountRate,
      discountAmount,
      subtotal,
      grandTotal,
      notes: `Generated automatically from subscription: "${sub.title}"`,
      bankDetails: company ? `${company.bankDetails?.bankName || ''} A/C: ${company.bankDetails?.accountNumber || ''}` : '',
      termsAndConditions: company ? company.termsAndConditions : '',
      status: 'unpaid'
    });

    const newInvoice = await invoice.save();

    // Advance next billing date
    const lastBilled = new Date();
    const nextBilled = new Date(sub.nextBillingDate || new Date());
    if (sub.frequency === 'monthly') {
      nextBilled.setMonth(nextBilled.getMonth() + 1);
    } else {
      nextBilled.setFullYear(nextBilled.getFullYear() + 1);
    }

    sub.lastBilledDate = lastBilled;
    sub.nextBillingDate = nextBilled;
    await sub.save();

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice: newInvoice,
      subscription: sub
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
