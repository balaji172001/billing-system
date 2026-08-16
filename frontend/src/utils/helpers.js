// ---- Formatting Helpers ----

/**
 * Format a number as currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format a Date (or ISO string) to a locale date string
 */
export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get the CSS class for a badge based on invoice/subscription status
 */
export function statusBadgeClass(status) {
  const map = {
    paid: 'badge-paid',
    sent: 'badge-sent',
    draft: 'badge-draft',
    unpaid: 'badge-unpaid',
    overdue: 'badge-overdue',
    partially_paid: 'badge-partially_paid',
    refunded: 'badge-refunded',
    active: 'badge-active',
    paused: 'badge-paused',
    completed: 'badge-completed',
    monthly: 'badge-monthly',
    yearly: 'badge-yearly',
  };
  return map[status] || 'badge-draft';
}

/**
 * Get a human-readable label for a status
 */
export function statusLabel(status) {
  return (status || 'unknown').replace(/_/g, ' ');
}

/**
 * Determine if an invoice is overdue
 */
export function isOverdue(invoice) {
  return (
    (invoice.status === 'unpaid' || invoice.status === 'sent') &&
    new Date(invoice.dueDate) < new Date()
  );
}

/**
 * Get the first letter(s) of a name for avatar display
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
