import express from 'express';
import Company from '../models/Company.js';

const router = express.Router();

// Get company profile settings (or create/return default)
router.get('/', async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      // Create a default company settings if none exists
      company = await Company.create({
        name: 'My Business Name',
        address: '123 Business Rd, City, Country',
        email: 'billing@mybusiness.com',
        phone: '+1 555-0199',
        taxNumber: 'GST-9999999',
        currency: 'USD',
        invoicePrefix: 'INV-',
        defaultTaxRate: 10,
        bankDetails: {
          bankName: 'SaaS Bank',
          accountNumber: '1234567890',
          ifscOrSwift: 'SAASUS33',
          accountName: 'My Business Accounts'
        },
        termsAndConditions: 'Payment is due within invoice due terms. Thank you for your business!'
      });
    }
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update company profile settings
router.put('/', async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = new Company(req.body);
    } else {
      Object.assign(company, req.body);
    }
    await company.save();
    res.json(company);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
