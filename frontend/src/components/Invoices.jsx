import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Eye, Download, Send, RefreshCw, FileText, Edit2 } from 'lucide-react';
import Dialog from './Dialog';
import { getInvoices, getClients, createInvoice, updateInvoice, deleteInvoice, sendInvoiceEmail, getInvoicePdfUrl, getCompany } from '../utils/api';
import { formatCurrency, formatDate, statusLabel, statusBadgeClass, isOverdue } from '../utils/helpers';
import './Invoices.css';

const EMPTY_LINE = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const STATUSES = ['draft', 'sent', 'unpaid', 'paid', 'partially_paid', 'overdue', 'refunded'];

function calcTotals(lineItems, taxRate, discountRate) {
  const subtotal = lineItems.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
  const dr = Number(discountRate) || 0;
  const tr = Number(taxRate) || 0;
  const discountAmount = (subtotal * dr) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * tr) / 100;
  const grandTotal = taxable + taxAmount;
  return { subtotal, discountAmount, taxAmount, grandTotal };
}

export default function Invoices({ onOverdueChange }) {
  const [invoices, setInvoices]     = useState([]);
  const [clients, setClients]       = useState([]);
  const [company, setCompany]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewing, setViewing]       = useState(null);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [sending, setSending]       = useState(null);

  const [form, setForm] = useState({
    client: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'USD',
    paymentTerms: 'Due on Receipt',
    taxRate: 10,
    discountRate: 0,
    notes: '',
    lineItems: [{ ...EMPTY_LINE }],
    status: 'draft',
  });

  const load = (params = {}) => {
    setLoading(true);
    getInvoices(params)
      .then(data => {
        setInvoices(data);
        const overdue = data.filter(isOverdue).length;
        if (onOverdueChange) onOverdueChange(overdue);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getClients().then(setClients).catch(() => {});
    getCompany().then(c => { setCompany(c); setForm(f => ({ ...f, taxRate: c.defaultTaxRate || 0, currency: c.currency || 'USD' })); }).catch(() => {});
  }, []);

  const applyFilter = () => {
    const params = {};
    if (search) params.search = search;
    if (filterStatus) params.status = filterStatus;
    load(params);
  };

  useEffect(() => { applyFilter(); }, [search, filterStatus]);

  const resetForm = () => setForm({
    client: clients[0]?._id || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: company?.currency || 'USD',
    paymentTerms: 'Due on Receipt',
    taxRate: company?.defaultTaxRate || 0,
    discountRate: 0,
    notes: '',
    lineItems: [{ ...EMPTY_LINE }],
    status: 'draft',
  });

  const openCreate = () => {
    setEditing(null);
    setError('');
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (inv) => {
    setEditing(inv);
    setError('');
    setForm({
      client: inv.client?._id || inv.client || '',
      issueDate: inv.issueDate ? inv.issueDate.split('T')[0] : '',
      dueDate: inv.dueDate ? inv.dueDate.split('T')[0] : '',
      currency: inv.currency || 'USD',
      paymentTerms: inv.paymentTerms || '',
      taxRate: inv.taxRate || 0,
      discountRate: inv.discountRate || 0,
      notes: inv.notes || '',
      status: inv.status || 'draft',
      lineItems: inv.lineItems?.length ? inv.lineItems.map(l => ({ ...l })) : [{ ...EMPTY_LINE }],
    });
    setDialogOpen(true);
  };

  const openView = (inv) => { setViewing(inv); setViewDialog(true); };

  // Line item helpers
  const updateLine = (idx, field, val) => {
    setForm(f => {
      const items = f.lineItems.map((l, i) => {
        if (i !== idx) return l;
        const updated = { ...l, [field]: val };
        updated.total = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
        return updated;
      });
      return { ...f, lineItems: items };
    });
  };

  const addLine = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_LINE }] }));
  const removeLine = (idx) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));

  const totals = calcTotals(form.lineItems, form.taxRate, form.discountRate);

  const handleSave = async () => {
    if (!form.client) { setError('Please select a client.'); return; }
    if (!form.dueDate) { setError('Due date is required.'); return; }
    if (form.lineItems.length === 0 || !form.lineItems[0].description) { setError('Add at least one line item.'); return; }
    setSaving(true); setError('');
    try {
      if (editing) {
        await updateInvoice(editing._id, form);
      } else {
        await createInvoice(form);
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await deleteInvoice(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSend = async (inv) => {
    setSending(inv._id);
    try {
      const result = await sendInvoiceEmail(inv._id);
      if (result.previewUrl) {
        window.open(result.previewUrl, '_blank');
      }
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="invoices-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" id="btn-new-invoice" onClick={openCreate}>
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {error && !dialogOpen && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} />
          <input
            id="invoice-search"
            className="form-input"
            placeholder="Search invoice number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select id="invoice-filter-status" className="form-select invoices-status-filter" value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <button className="btn btn-secondary btn-icon" onClick={() => load()} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={24} /></div>
          <div className="empty-state-title">No invoices yet</div>
          <div className="empty-state-desc">Create your first invoice to get started.</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Invoice</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
                <th className="invoices-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const balance = (inv.grandTotal || 0) - (inv.amountPaid || 0);
                return (
                  <tr key={inv._id} id={`invoice-row-${inv._id}`} className={isOverdue(inv) ? 'invoices-row-overdue' : ''}>
                    <td>
                      <span className="invoices-num">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="invoices-client-name">{inv.client?.name || '—'}</td>
                    <td className="invoices-text-muted">{formatDate(inv.issueDate)}</td>
                    <td className={isOverdue(inv) ? 'invoices-due-overdue' : 'invoices-text-muted'}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="invoices-amount">{formatCurrency(inv.grandTotal, inv.currency)}</td>
                    <td className={balance > 0 ? 'invoices-balance-due' : 'invoices-balance-paid'}>
                      {formatCurrency(balance, inv.currency)}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(isOverdue(inv) ? 'overdue' : inv.status)}`}>
                        {statusLabel(isOverdue(inv) ? 'overdue' : inv.status)}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions invoices-actions-cell">
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => openView(inv)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(inv)}>
                          <Edit2 size={14} />
                        </button>
                        <a className="btn btn-ghost btn-icon btn-sm" href={getInvoicePdfUrl(inv._id)} target="_blank" rel="noreferrer" title="Download PDF">
                          <Download size={14} />
                        </a>
                        <button
                          className="btn btn-success btn-icon btn-sm"
                          title="Send Email"
                          onClick={() => handleSend(inv)}
                          disabled={sending === inv._id}
                        >
                          {sending === inv._id ? <div className="spinner invoices-send-spinner" /> : <Send size={14} />}
                        </button>
                        <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(inv._id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? `Edit Invoice ${editing.invoiceNumber}` : 'New Invoice'}
        wide
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn btn-primary" id="btn-save-invoice" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Invoice'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select id="invoice-client" className="form-select" value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}>
              <option value="">— Select client —</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select id="invoice-currency" className="form-select" value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['USD','EUR','GBP','INR','AUD','CAD','SGD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input id="invoice-issue-date" type="date" className="form-input" value={form.issueDate}
              onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input id="invoice-due-date" type="date" className="form-input" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <input id="invoice-terms" className="form-input" placeholder="Due on Receipt" value={form.paymentTerms}
              onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} />
          </div>
          {editing && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="invoice-status" className="form-select" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div>
          <div className="invoices-line-header">
            <label className="form-label invoices-line-label">Line Items</label>
            <button className="btn btn-secondary btn-sm" id="btn-add-line-item" onClick={addLine}>
              <Plus size={12} /> Add Row
            </button>
          </div>
          <table className="line-items-table">
            <thead>
              <tr>
                <th className="invoices-th-desc">Description</th>
                <th className="invoices-th-qty">Qty</th>
                <th className="invoices-th-price">Unit Price</th>
                <th className="invoices-th-total">Total</th>
                <th className="invoices-th-action"></th>
              </tr>
            </thead>
            <tbody>
              {form.lineItems.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      id={`line-desc-${idx}`}
                      className="form-input"
                      placeholder="Item description"
                      value={line.description}
                      onChange={e => updateLine(idx, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      id={`line-qty-${idx}`}
                      className="form-input"
                      type="number" min="0"
                      value={line.quantity}
                      onChange={e => updateLine(idx, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      id={`line-price-${idx}`}
                      className="form-input"
                      type="number" min="0" step="0.01"
                      value={line.unitPrice}
                      onChange={e => updateLine(idx, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td className="line-total">
                    {formatCurrency((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), form.currency)}
                  </td>
                  <td>
                    {form.lineItems.length > 1 && (
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeLine(idx)}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tax / Discount */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input id="invoice-tax" className="form-input" type="number" min="0" max="100" step="0.1"
              value={form.taxRate}
              onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Discount (%)</label>
            <input id="invoice-discount" className="form-input" type="number" min="0" max="100" step="0.1"
              value={form.discountRate}
              onChange={e => setForm(f => ({ ...f, discountRate: e.target.value }))} />
          </div>
        </div>

        {/* Totals Summary */}
        <div className="invoice-totals">
          <div className="invoice-total-row">
            <span className="invoice-total-label">Subtotal</span>
            <span className="invoice-total-value">{formatCurrency(totals.subtotal, form.currency)}</span>
          </div>
          {totals.discountAmount > 0 && (
            <div className="invoice-total-row">
              <span className="invoice-total-label">Discount ({form.discountRate}%)</span>
              <span className="invoice-total-value invoices-discount-value">
                -{formatCurrency(totals.discountAmount, form.currency)}
              </span>
            </div>
          )}
          {totals.taxAmount > 0 && (
            <div className="invoice-total-row">
              <span className="invoice-total-label">Tax ({form.taxRate}%)</span>
              <span className="invoice-total-value">{formatCurrency(totals.taxAmount, form.currency)}</span>
            </div>
          )}
          <div className="invoice-total-row grand">
            <span className="invoice-total-label">Grand Total</span>
            <span>{formatCurrency(totals.grandTotal, form.currency)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea id="invoice-notes" className="form-textarea" placeholder="Additional notes for the client..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        title={viewing?.invoiceNumber || 'Invoice Details'}
        wide
        footer={
          <>
            <a className="btn btn-secondary" href={viewing ? getInvoicePdfUrl(viewing._id) : '#'} target="_blank" rel="noreferrer">
              <Download size={14} /> Download PDF
            </a>
            <button className="btn btn-primary" onClick={() => { setViewDialog(false); if(viewing) openEdit(viewing); }}>
              <Edit2 size={14} /> Edit
            </button>
          </>
        }
      >
        {viewing && (
          <>
            <div className="invoice-view-header">
              <div>
                <div className="invoices-view-title">
                  {viewing.invoiceNumber}
                </div>
                <div className="invoices-view-badge-wrap">
                  <span className={`badge ${statusBadgeClass(isOverdue(viewing) ? 'overdue' : viewing.status)}`}>
                    {statusLabel(isOverdue(viewing) ? 'overdue' : viewing.status)}
                  </span>
                </div>
              </div>
              <div className="invoice-view-meta">
                <div className="invoice-view-meta-row">
                  <span className="invoice-view-meta-label">Client</span>
                  <span className="invoice-view-meta-value">{viewing.client?.name || '—'}</span>
                </div>
                <div className="invoice-view-meta-row">
                  <span className="invoice-view-meta-label">Issue Date</span>
                  <span className="invoice-view-meta-value">{formatDate(viewing.issueDate)}</span>
                </div>
                <div className="invoice-view-meta-row">
                  <span className="invoice-view-meta-label">Due Date</span>
                  <span className={isOverdue(viewing) ? 'invoice-view-meta-value invoices-due-overdue' : 'invoice-view-meta-value'}>
                    {formatDate(viewing.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" />

            <table className="line-items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th className="invoices-th-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewing.lineItems?.map((l, i) => (
                  <tr key={i}>
                    <td>{l.description}</td>
                    <td>{l.quantity}</td>
                    <td>{formatCurrency(l.unitPrice, viewing.currency)}</td>
                    <td className="invoices-td-right-bold">{formatCurrency(l.total, viewing.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="invoice-total-row">
                <span className="invoice-total-label">Subtotal</span>
                <span className="invoice-total-value">{formatCurrency(viewing.subtotal, viewing.currency)}</span>
              </div>
              {viewing.discountAmount > 0 && (
                <div className="invoice-total-row">
                  <span className="invoice-total-label">Discount ({viewing.discountRate}%)</span>
                  <span className="invoice-total-value invoices-discount-value">-{formatCurrency(viewing.discountAmount, viewing.currency)}</span>
                </div>
              )}
              {viewing.taxAmount > 0 && (
                <div className="invoice-total-row">
                  <span className="invoice-total-label">Tax ({viewing.taxRate}%)</span>
                  <span className="invoice-total-value">{formatCurrency(viewing.taxAmount, viewing.currency)}</span>
                </div>
              )}
              <div className="invoice-total-row grand">
                <span className="invoice-total-label">Grand Total</span>
                <span>{formatCurrency(viewing.grandTotal, viewing.currency)}</span>
              </div>
              <div className="invoice-total-row">
                <span className="invoice-total-label invoices-paid-label">Amount Paid</span>
                <span className="invoice-total-value invoices-paid-value">{formatCurrency(viewing.amountPaid, viewing.currency)}</span>
              </div>
              <div className="invoice-total-row invoices-balance-row">
                <span className="invoice-total-label invoices-balance-label">Balance Due</span>
                <span className="invoices-balance-val">{formatCurrency((viewing.grandTotal || 0) - (viewing.amountPaid || 0), viewing.currency)}</span>
              </div>
            </div>

            {viewing.notes && (
              <div className="card-glass invoices-notes-card">
                <div className="form-label invoices-notes-label">Notes</div>
                <p className="invoices-notes-text">{viewing.notes}</p>
              </div>
            )}
          </>
        )}
      </Dialog>
    </div>
  );
}
