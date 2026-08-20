import express from 'express';
import Client from '../models/Client.js';
import Company from '../models/Company.js';
import Invoice from '../models/Invoice.js';
import Subscription from '../models/Subscription.js';

const router = express.Router();

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * GET /sitemap.xml
 * Fully dynamic XML Sitemap generator reading live records from MongoDB database
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const host = req.get('host') || 'localhost:5001';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Base system routes
    const routes = [
      { url: '/', priority: '1.0', changefreq: 'daily', lastmod: new Date() },
      { url: '/login', priority: '0.8', changefreq: 'monthly', lastmod: new Date() },
      { url: '/dashboard', priority: '0.9', changefreq: 'daily', lastmod: new Date() },
      { url: '/invoices', priority: '0.9', changefreq: 'daily', lastmod: new Date() },
      { url: '/clients', priority: '0.8', changefreq: 'weekly', lastmod: new Date() },
      { url: '/subscriptions', priority: '0.8', changefreq: 'weekly', lastmod: new Date() },
      { url: '/payments', priority: '0.8', changefreq: 'daily', lastmod: new Date() },
      { url: '/settings', priority: '0.5', changefreq: 'monthly', lastmod: new Date() },
    ];

    // Fetch dynamic database entities from MongoDB
    const [clients, invoices, subscriptions] = await Promise.all([
      Client.find({}, '_id updatedAt createdAt').lean(),
      Invoice.find({}, '_id updatedAt createdAt').lean(),
      Subscription.find({}, '_id updatedAt createdAt').lean(),
    ]);

    // Append dynamic Client routes from MongoDB
    clients.forEach((client) => {
      routes.push({
        url: `/clients/${client._id}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: client.updatedAt || client.createdAt,
      });
    });

    // Append dynamic Invoice routes from MongoDB
    invoices.forEach((inv) => {
      routes.push({
        url: `/invoices/${inv._id}`,
        priority: '0.7',
        changefreq: 'daily',
        lastmod: inv.updatedAt || inv.createdAt,
      });
    });

    // Append dynamic Subscription routes from MongoDB
    subscriptions.forEach((sub) => {
      routes.push({
        url: `/subscriptions/${sub._id}`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: sub.updatedAt || sub.createdAt,
      });
    });

    const xmlUrls = routes
      .map(
        (r) => `  <url>
    <loc>${baseUrl}${r.url}</loc>
    <lastmod>${formatDate(r.lastmod)}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join('\n');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.orgs/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemapXml);
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    res.status(500).send('Error generating dynamic sitemap');
  }
});

/**
 * GET /robots.txt
 * Dynamic crawler directives pointing to dynamic sitemap
 */
router.get('/robots.txt', (req, res) => {
  const host = req.get('host') || 'localhost:5001';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

/**
 * GET /api/seo/metadata
 * Dynamic SEO metadata endpoint for frontend brand / company title integration
 */
router.get('/api/seo/metadata', async (req, res) => {
  try {
    const company = await Company.findOne().lean();
    const companyName = company ? company.name : 'BillFlow';
    res.json({
      siteName: companyName,
      title: `${companyName} — Billing & Invoicing System`,
      description: `Official billing portal for ${companyName}. Manage invoices, subscriptions, payments, and client records securely.`,
    });
  } catch {
    res.json({
      siteName: 'BillFlow',
      title: 'BillFlow — Billing & Invoicing System',
      description: 'Manage invoices, subscriptions, payments, and client records securely.',
    });
  }
});

export default router;
