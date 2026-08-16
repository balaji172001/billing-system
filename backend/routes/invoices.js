import express from 'express';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Company from '../models/Company.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { sendInvoiceEmail } from '../utils/emailService.js';

const router = express.Router();

// Helper to auto-generate Invoice Number
async function getNextInvoiceNumber() {
  const company = await Company.findOne();
  const prefix = company ? company.invoicePrefix : 'INV-';
  const year = new Date().getFullYear();
  
  // Find invoices matching prefix and year, e.g. /INV-2026-/
  const regex = new RegExp(`^${prefix}${year}-`);
  const latestInvoice = await Invoice.findOne({ invoiceNumber: regex }).sort({ invoiceNumber: -1 });
  
  let nextSeq = 1;
  if (latestInvoice) {
    const parts = latestInvoice.invoiceNumber.split('-');
    const lastSeqStr = parts[parts.length - 1];
    const lastSeq = parseInt(lastSeqStr, 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }
  
  return `${prefix}${year}-${String(nextSeq).padStart(4, '0')}`;
}

// Get all invoices (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, clientId, search } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (clientId) query.client = clientId;
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const invoices = await Invoice.find(query)
      .populate('client')
      .sort({ createdAt: -1 });
      
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  try {
    const {
      client,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      lineItems,
      taxRate,
      discountRate,
      notes,
      termsAndConditions
    } = req.body;

    // Verify Client exists
    const clientRecord = await Client.findById(client);
    if (!clientRecord) return res.status(400).json({ message: 'Invalid client' });

    // Fetch company defaults if not overridden
    const company = await Company.findOne();
    const activeTaxRate = taxRate !== undefined ? taxRate : (company ? company.defaultTaxRate : 0);
    const activeTerms = termsAndConditions || (company ? company.termsAndConditions : '');
    const activeBank = company ? `${company.bankDetails?.bankName || ''} A/C: ${company.bankDetails?.accountNumber || ''}` : '';

    // Calculate totals
    let subtotal = 0;
    const items = (lineItems || []).map(item => {
      const total = Number(item.quantity) * Number(item.unitPrice);
      subtotal += total;
      return {
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total
      };
    });

    const discountRateNum = Number(discountRate || 0);
    const discountAmount = (subtotal * discountRateNum) / 100;
    const taxableSubtotal = subtotal - discountAmount;
    
    const taxRateNum = Number(activeTaxRate || 0);
    const taxAmount = (taxableSubtotal * taxRateNum) / 100;
    const grandTotal = taxableSubtotal + taxAmount;

    // Generate Invoice Number
    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      client,
      issueDate: issueDate || new Date(),
      dueDate,
      currency: currency || (company ? company.currency : 'USD'),
      paymentTerms: paymentTerms || 'Due on Receipt',
      lineItems: items,
      taxRate: taxRateNum,
      taxAmount,
      discountRate: discountRateNum,
      discountAmount,
      subtotal,
      grandTotal,
      notes,
      bankDetails: activeBank,
      termsAndConditions: activeTerms,
      status: 'draft' // default status
    });

    const newInvoice = await invoice.save();
    // Populate before sending back
    await newInvoice.populate('client');
    res.status(201).json(newInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Extract fields
    const {
      client,
      issueDate,
      dueDate,
      currency,
      paymentTerms,
      lineItems,
      taxRate,
      discountRate,
      notes,
      termsAndConditions,
      status
    } = req.body;

    if (client) invoice.client = client;
    if (issueDate) invoice.issueDate = issueDate;
    if (dueDate) invoice.dueDate = dueDate;
    if (currency) invoice.currency = currency;
    if (paymentTerms) invoice.paymentTerms = paymentTerms;
    if (notes !== undefined) invoice.notes = notes;
    if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;
    if (status) invoice.status = status;

    if (lineItems) {
      let subtotal = 0;
      invoice.lineItems = lineItems.map(item => {
        const total = Number(item.quantity) * Number(item.unitPrice);
        subtotal += total;
        return {
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total
        };
      });
      invoice.subtotal = subtotal;
    }

    if (discountRate !== undefined) invoice.discountRate = Number(discountRate);
    invoice.discountAmount = (invoice.subtotal * invoice.discountRate) / 100;

    const taxableSubtotal = invoice.subtotal - invoice.discountAmount;

    if (taxRate !== undefined) invoice.taxRate = Number(taxRate);
    invoice.taxAmount = (taxableSubtotal * invoice.taxRate) / 100;
    
    invoice.grandTotal = taxableSubtotal + invoice.taxAmount;

    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate('client');
    res.json(updatedInvoice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Generate PDF for Invoice
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const company = await Company.findOne() || {};

    const pdfBuffer = await generateInvoicePDF(invoice, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice_${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Email Invoice PDF to Client
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('client');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const client = invoice.client;
    if (!client || !client.email) {
      return res.status(400).json({ message: 'Client email is required to send invoice.' });
    }

    const company = await Company.findOne() || {};

    // Generate PDF attachment
    const pdfBuffer = await generateInvoicePDF(invoice, company);

    const emailContent = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Hello ${client.name},</h2>
        <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong> issued on ${new Date(invoice.issueDate).toLocaleDateString()}.</p>
        <p><strong>Total Amount Due:</strong> ${invoice.currency} ${(invoice.grandTotal - invoice.amountPaid).toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
        <br>
        <p>Thank you for choosing ${company.name || 'our company'}!</p>
      </div>
    `;

    const result = await sendInvoiceEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${company.name || 'Billing System'}`,
      html: emailContent,
      attachments: [{
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    if (result.success) {
      invoice.status = 'sent';
      await invoice.save();
      res.json({ message: 'Invoice emailed successfully', previewUrl: result.previewUrl });
    } else {
      res.status(500).json({ message: result.message || 'Failed to email invoice' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
