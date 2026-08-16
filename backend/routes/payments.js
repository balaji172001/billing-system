import express from 'express';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate({
        path: 'invoice',
        populate: { path: 'client' }
      })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a new payment
router.post('/', async (req, res) => {
  try {
    const { invoice, amount, date, method, transactionId, notes } = req.body;
    
    // Validate Invoice
    const invoiceRecord = await Invoice.findById(invoice);
    if (!invoiceRecord) return res.status(404).json({ message: 'Invoice not found' });

    // Create payment
    const payment = new Payment({
      invoice,
      amount: Number(amount),
      date: date || new Date(),
      method,
      transactionId,
      notes
    });

    const newPayment = await payment.save();

    // Update invoice paid amount
    invoiceRecord.amountPaid = Number(invoiceRecord.amountPaid || 0) + Number(amount);
    
    // Re-determine status
    if (invoiceRecord.amountPaid >= invoiceRecord.grandTotal) {
      invoiceRecord.status = 'paid';
    } else if (invoiceRecord.amountPaid > 0) {
      invoiceRecord.status = 'partially_paid';
    } else {
      invoiceRecord.status = 'unpaid';
    }

    await invoiceRecord.save();

    res.status(201).json(newPayment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
