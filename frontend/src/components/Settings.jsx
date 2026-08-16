import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, CheckCircle } from 'lucide-react';
import { getCompany, updateCompany } from '../utils/api';
import './Settings.css';

export default function Settings() {
  const [form, setForm] = useState({
    name: '', address: '', email: '', phone: '', taxNumber: '',
    currency: 'USD', invoicePrefix: 'INV-', defaultTaxRate: 0,
    termsAndConditions: '',
    bankDetails: { bankName: '', accountNumber: '', ifscOrSwift: '', accountName: '' },
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    getCompany()
      .then(c => setForm({
        name: c.name || '',
        address: c.address || '',
        email: c.email || '',
        phone: c.phone || '',
        taxNumber: c.taxNumber || '',
        currency: c.currency || 'USD',
        invoicePrefix: c.invoicePrefix || 'INV-',
        defaultTaxRate: c.defaultTaxRate ?? 0,
        termsAndConditions: c.termsAndConditions || '',
        bankDetails: {
          bankName: c.bankDetails?.bankName || '',
          accountNumber: c.bankDetails?.accountNumber || '',
          ifscOrSwift: c.bankDetails?.ifscOrSwift || '',
          accountName: c.bankDetails?.accountName || '',
        },
      }))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const setBank = (field, val) => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, [field]: val } }));

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateCompany(form);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your business profile and invoice defaults</p>
        </div>
        <button className="btn btn-primary" id="btn-save-settings" onClick={handleSave} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {success && <div className="alert alert-success"><CheckCircle size={15} />{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Business Profile */}
      <div className="card">
        <div className="settings-card-header">
          <div className="settings-icon-wrapper">
            <SettingsIcon size={16} />
          </div>
          <h2 className="settings-card-title">Business Profile</h2>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input id="settings-name" className="form-input" placeholder="My Business LLC" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Business Email</label>
            <input id="settings-email" className="form-input" type="email" placeholder="billing@mybusiness.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input id="settings-phone" className="form-input" placeholder="+1 555-0199" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax / GST / VAT Number</label>
            <input id="settings-tax-num" className="form-input" placeholder="GST-9999999" value={form.taxNumber}
              onChange={e => setForm(f => ({ ...f, taxNumber: e.target.value }))} />
          </div>
        </div>

        <div className="form-group settings-form-group-margin">
          <label className="form-label">Business Address</label>
          <textarea id="settings-address" className="form-textarea" placeholder="123 Business Rd, City, Country"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </div>

      {/* Invoice Defaults */}
      <div className="card">
        <h2 className="settings-card-title settings-title-margin">Invoice Defaults</h2>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">Default Currency</label>
            <select id="settings-currency" className="form-select" value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
              {['USD','EUR','GBP','INR','AUD','CAD','SGD','JPY'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Prefix</label>
            <input id="settings-prefix" className="form-input" placeholder="INV-" value={form.invoicePrefix}
              onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Default Tax Rate (%)</label>
            <input id="settings-tax-rate" className="form-input" type="number" min="0" max="100" step="0.1"
              value={form.defaultTaxRate}
              onChange={e => setForm(f => ({ ...f, defaultTaxRate: e.target.value }))} />
          </div>
        </div>
        <div className="form-group settings-form-group-margin">
          <label className="form-label">Default Terms & Conditions</label>
          <textarea id="settings-terms" className="form-textarea settings-textarea-terms"
            placeholder="Payment is due within invoice due terms. Thank you for your business!"
            value={form.termsAndConditions}
            onChange={e => setForm(f => ({ ...f, termsAndConditions: e.target.value }))} />
        </div>
      </div>

      {/* Bank Details */}
      <div className="card">
        <h2 className="settings-card-title settings-title-margin">Bank / Payment Details</h2>
        <p className="settings-subtext">
          These details will be printed on invoices for client payment reference.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Bank Name</label>
            <input id="settings-bank-name" className="form-input" placeholder="National Bank" value={form.bankDetails.bankName}
              onChange={e => setBank('bankName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Name</label>
            <input id="settings-acct-name" className="form-input" placeholder="My Business Accounts" value={form.bankDetails.accountName}
              onChange={e => setBank('accountName', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input id="settings-acct-num" className="form-input" placeholder="0000000000" value={form.bankDetails.accountNumber}
              onChange={e => setBank('accountNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC / SWIFT Code</label>
            <input id="settings-swift" className="form-input" placeholder="BANKUS33" value={form.bankDetails.ifscOrSwift}
              onChange={e => setBank('ifscOrSwift', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Email Config Info */}
      <div className="card settings-email-card">
        <h2 className="settings-email-title">
          📧 Email Configuration
        </h2>
        <p className="settings-email-desc">
          The system uses <strong className="settings-text-primary">Ethereal Email</strong> (mock SMTP) for testing.
          When you click "Send" on an invoice, the email is generated and a <strong className="settings-text-cyan">preview link</strong> opens in your browser —
          no real email is sent. To configure a real SMTP provider, add credentials to the backend <code className="settings-code-env">.env</code> file:
        </p>
        <div className="settings-smtp-box">
          SMTP_HOST=smtp.gmail.com<br />
          SMTP_PORT=587<br />
          SMTP_USER=your@email.com<br />
          SMTP_PASS=your_app_password
        </div>
      </div>
    </div>
  );
}
