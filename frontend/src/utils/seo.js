let cachedSiteName = 'BillFlow';

/**
 * Fast synchronous SEO page title and meta description updater
 */
export function updatePageSEO(viewName, entityTitle = null) {
  const brandName = cachedSiteName;

  const viewTitles = {
    dashboard: `Dashboard — ${brandName} Analytics`,
    invoices: `Invoices — ${brandName} Billing Suite`,
    clients: `Clients Directory — ${brandName}`,
    payments: `Payment History — ${brandName}`,
    subscriptions: `Subscriptions & Recurring Billing — ${brandName}`,
    settings: `Company & Security Settings — ${brandName}`,
    login: `Secure Login — ${brandName}`,
  };

  const title = entityTitle ? `${entityTitle} — ${brandName}` : (viewTitles[viewName] || viewTitles.dashboard);
  const description = `Live financial billing and invoicing platform on ${brandName}.`;

  // Update Document Title
  document.title = title;

  // Update Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description);
  } else {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = description;
    document.head.appendChild(metaDesc);
  }

  // Update OpenGraph Title & Description
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description);
}

/**
 * Optionally updates cached brand name after company details load
 */
export function setSEOBrandName(name) {
  if (name) {
    cachedSiteName = name;
  }
}
