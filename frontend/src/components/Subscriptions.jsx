import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, Play, Pause } from 'lucide-react';
import Dialog from './Dialog';
import { getSubscriptions, createSubscription, updateSubscription, triggerSubscription, getClients } from '../utils/api';
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '../utils/helpers';
import './Subscriptions.css';

export default function Subscriptions() {
  const [subs, setSubs]           = useState([]);
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [triggering, setTriggering] = useState(null);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [form, setForm] = useState({
    client: '',
    title: '',
    amount: '',
    frequency: 'monthly',
    nextBillingDate: new Date().toISOString().split('T')[0],
    currency: 'USD',
    taxRate: 0,
    discountRate: 0,
  });

  const load = () => {
    setLoading(true);
    Promise.all([getSubscriptions(), getClients()])
      .then(([s, c]) => { setSubs(s); setClients(c); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ client: '', title: '', amount: '', frequency: 'monthly', nextBillingDate: new Date().toISOString().split('T')[0], currency: 'USD', taxRate: 0, discountRate: 0 });
    setError(''); setSuccess('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client || !form.title || !form.amount) { setError('Client, title, and amount are required.'); return; }
    setSaving(true); setError('');
    try {
      await createSubscription({ ...form, amount: Number(form.amount) });
      setDialogOpen(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      await updateSubscription(sub._id, { status: newStatus });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTrigger = async (sub) => {
    if (!window.confirm(`Generate an invoice now for "${sub.title}"?`)) return;
    setTriggering(sub._id);
    setError(''); setSuccess('');
    try {
      await triggerSubscription(sub._id);
      setSuccess(`Invoice generated for "${sub.title}"!`);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="subscriptions-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Recurring Subscriptions</h1>
          <p className="page-subtitle">Manage recurring billing schedules</p>
        </div>
        <button className="btn btn-primary" id="btn-new-subscription" onClick={openCreate}>
          <Plus size={15} /> New Subscription
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !dialogOpen && <div className="alert alert-error">{error}</div>}

      {/* Table */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : subs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><RefreshCcw size={24} /></div>
          <div className="empty-state-title">No subscriptions yet</div>
          <div className="empty-state-desc">Set up recurring billing for your clients.</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Subscription</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Next Billing</th>
                <th>Last Billed</th>
                <th>Status</th>
                <th className="subscriptions-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub._id} id={`sub-row-${sub._id}`}>
                  <td className="subscriptions-title">{sub.title}</td>
                  <td>{sub.client?.name || '—'}</td>
                  <td className="subscriptions-amount">{formatCurrency(sub.amount, sub.currency)}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(sub.frequency)}`}>{sub.frequency}</span>
                  </td>
                  <td className="subscriptions-text-secondary">{formatDate(sub.nextBillingDate)}</td>
                  <td className="subscriptions-text-muted">{sub.lastBilledDate ? formatDate(sub.lastBilledDate) : 'Never'}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(sub.status)}`}>{statusLabel(sub.status)}</span>
                  </td>
                  <td>
                    <div className="table-actions subscriptions-actions-cell">
                      <button
                        className="btn btn-primary btn-sm"
                        title="Generate Invoice Now"
                        id={`btn-trigger-${sub._id}`}
                        onClick={() => handleTrigger(sub)}
                        disabled={sub.status !== 'active' || triggering === sub._id}
                      >
                        {triggering === sub._id
                          ? <div className="spinner subscriptions-trigger-spinner" />
                          : <><Play size={12} /> Bill Now</>
                        }
                      </button>
                      <button
                        className={`btn btn-sm ${sub.status === 'active' ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => toggleStatus(sub)}
                        title={sub.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {sub.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Activate</>}
                      </button>
                    </div>
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
        title="New Recurring Subscription"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn btn-primary" id="btn-save-subscription" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Create Subscription'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select id="sub-client" className="form-select" value={form.client}
              onChange={e => setForm(f => ({ ...f, client: e.target.value }))}>
              <option value="">— Select client —</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subscription Title *</label>
            <input id="sub-title" className="form-input" placeholder="Monthly Pro Plan" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input id="sub-amount" className="form-input" type="number" min="0" step="0.01"
              placeholder="99.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select id="sub-frequency" className="form-select" value={form.frequency}
              onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select id="sub-currency" className="form-select" value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['USD','EUR','GBP','INR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">First Billing Date</label>
            <input id="sub-next-date" className="form-input" type="date" value={form.nextBillingDate}
              onChange={e => setForm(f => ({ ...f, nextBillingDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input id="sub-tax" className="form-input" type="number" min="0" value={form.taxRate}
              onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Discount (%)</label>
            <input id="sub-discount" className="form-input" type="number" min="0" value={form.discountRate}
              onChange={e => setForm(f => ({ ...f, discountRate: e.target.value }))} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
