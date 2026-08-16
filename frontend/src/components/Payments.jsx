import { useEffect, useState } from 'react';
import { Plus, CreditCard, CheckCircle } from 'lucide-react';
import Dialog from './Dialog';
import { getPayments, createPayment, getInvoices } from '../utils/api';
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '../utils/helpers';
import './Payments.css';

const METHODS = ['bank', 'card', 'cash', 'other'];

export default function Payments() {
  const [payments, setPayments]   = useState([]);
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [form, setForm] = useState({
    invoice: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'bank',
    transactionId: '',
    notes: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([getPayments(), getInvoices()])
      .then(([pmts, invs]) => {
        setPayments(pmts);
        // Only show unpaid/partially paid invoices in the dropdown
        setInvoices(invs.filter(i => i.status !== 'paid' && i.status !== 'refunded'));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openRecord = () => {
    setForm({ invoice: '', amount: '', date: new Date().toISOString().split('T')[0], method: 'bank', transactionId: '', notes: '' });
    setError(''); setSuccess('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.invoice) { setError('Please select an invoice.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError('Enter a valid payment amount.'); return; }
    setSaving(true); setError('');
    try {
      await createPayment({ ...form, amount: Number(form.amount) });
      setSuccess('Payment recorded successfully.');
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const methodIcon = (m) => {
    const icons = { card: '💳', bank: '🏦', cash: '💵', other: '📋' };
    return icons[m] || '💳';
  };

  return (
    <div className="payments-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button className="btn btn-primary" id="btn-record-payment" onClick={openRecord}>
          <Plus size={15} /> Record Payment
        </button>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={15} />{success}</div>}
      {error && !dialogOpen && <div className="alert alert-error">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CreditCard size={24} /></div>
          <div className="empty-state-title">No payments yet</div>
          <div className="empty-state-desc">Record a payment against an invoice.</div>
          <button className="btn btn-primary" onClick={openRecord}><Plus size={14} /> Record Payment</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Invoice Status</th>
                <th className="payments-th-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id} id={`payment-row-${p._id}`}>
                  <td>
                    <span className="payments-invoice-num">
                      {p.invoice?.invoiceNumber || '—'}
                    </span>
                  </td>
                  <td className="payments-client-name">{p.invoice?.client?.name || '—'}</td>
                  <td className="payments-text-muted">{formatDate(p.date)}</td>
                  <td>
                    <span className="payments-method-wrap">
                      {methodIcon(p.method)}
                      <span className="payments-method-label">{p.method}</span>
                    </span>
                  </td>
                  <td className="payments-txid">
                    {p.transactionId || '—'}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(p.invoice?.status)}`}>
                      {statusLabel(p.invoice?.status)}
                    </span>
                  </td>
                  <td className="payments-amount">
                    {formatCurrency(p.amount, p.invoice?.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Record Payment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn btn-primary" id="btn-save-payment" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Record Payment'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">Invoice *</label>
          <select id="payment-invoice" className="form-select" value={form.invoice}
            onChange={e => {
              const inv = invoices.find(i => i._id === e.target.value);
              const balance = inv ? ((inv.grandTotal || 0) - (inv.amountPaid || 0)) : '';
              setForm(f => ({ ...f, invoice: e.target.value, amount: balance || '' }));
            }}>
            <option value="">— Select invoice —</option>
            {invoices.map(inv => (
              <option key={inv._id} value={inv._id}>
                {inv.invoiceNumber} — {inv.client?.name} — Balance: {formatCurrency((inv.grandTotal || 0) - (inv.amountPaid || 0), inv.currency)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input id="payment-amount" className="form-input" type="number" min="0.01" step="0.01"
              placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input id="payment-date" className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select id="payment-method" className="form-select" value={form.method}
              onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <input id="payment-txid" className="form-input" placeholder="TXN-XXXXXXXX" value={form.transactionId}
              onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea id="payment-notes" className="form-textarea" placeholder="Optional notes..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Dialog>
    </div>
  );
}
