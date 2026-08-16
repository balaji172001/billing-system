import express from 'express';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Client from '../models/Client.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('client');
    const payments = await Payment.find();

    let totalRevenue = 0;
    let totalOutstanding = 0;
    
    const statusCounts = {
      paid: 0,
      partially_paid: 0,
      unpaid: 0,
      overdue: 0,
      draft: 0,
      sent: 0,
      refunded: 0
    };

    const clientBilled = {};
    const monthlyRevenue = {};

    invoices.forEach((invoice) => {
      // Add status counts
      if (statusCounts[invoice.status] !== undefined) {
        statusCounts[invoice.status]++;
      }

      // Calculations
      const grandTotal = invoice.grandTotal || 0;
      const amountPaid = invoice.amountPaid || 0;
      const due = grandTotal - amountPaid;

      totalRevenue += amountPaid;
      totalOutstanding += due;

      // Group by client
      if (invoice.client) {
        const clientName = invoice.client.name;
        clientBilled[clientName] = (clientBilled[clientName] || 0) + grandTotal;
      }

      // Group by month (issueDate)
      const date = new Date(invoice.issueDate);
      const monthStr = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevenue[monthStr] = (monthlyRevenue[monthStr] || 0) + grandTotal;
    });

    // Format top clients
    const topClients = Object.keys(clientBilled)
      .map((name) => ({ name, billed: clientBilled[name] }))
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 5);

    // Format monthly trends (last 6-12 months)
    const monthsOrder = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthsOrder.push(mStr);
    }

    const revenueTrends = monthsOrder.map((month) => ({
      month,
      revenue: monthlyRevenue[month] || 0
    }));

    // Status breakdown for Pie Chart
    const statusBreakdown = Object.keys(statusCounts).map((status) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: statusCounts[status]
    })).filter(item => item.value > 0);

    // Recent Payments
    const recentPayments = await Payment.find()
      .populate({
        path: 'invoice',
        select: 'invoiceNumber client',
        populate: { path: 'client', select: 'name' }
      })
      .sort({ date: -1 })
      .limit(5);

    // Overdue alerts
    const overdueInvoices = invoices
      .filter((inv) => inv.status === 'unpaid' && new Date(inv.dueDate) < new Date())
      .slice(0, 5);

    res.json({
      summary: {
        totalRevenue,
        totalOutstanding,
        totalInvoices: invoices.length,
        activeClients: await Client.countDocuments()
      },
      revenueTrends,
      statusBreakdown,
      topClients,
      recentPayments,
      overdueInvoices
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
