import express from 'express';
import Company from '../models/Company.js';

const router = express.Router();

// Get company profile settings
router.get('/', async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      // Return clean empty structure without static mock defaults
      return res.json({
        name: '',
        address: '',
        email: '',
        phone: '',
        taxNumber: '',
        currency: 'USD',
        invoicePrefix: 'INV-',
        defaultTaxRate: 0,
        bankDetails: {
          bankName: '',
          accountNumber: '',
          ifscOrSwift: '',
          accountName: '',
        },
        termsAndConditions: '',
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
