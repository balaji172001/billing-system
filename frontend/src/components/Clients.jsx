import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Mail, Phone, MapPin } from 'lucide-react';
import Dialog from './Dialog';
import { getClients, createClient, updateClient, deleteClient } from '../utils/api';
import { formatDate, getInitials } from '../utils/helpers';
import './Clients.css';

const EMPTY_FORM = { name: '', email: '', phone: '', address: '', taxNumber: '' };

export default function Clients() {
  const [clients, setClients]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = (q) => {
    setLoading(true);
    getClients(q)
      .then(setClients)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      taxNumber: client.taxNumber || '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Name and Email are required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateClient(editing._id, form);
      } else {
        await createClient(form);
      }
      setDialogOpen(false);
      load(search);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? This action cannot be undone.')) return;
    try {
      await deleteClient(id);
      load(search);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="clients-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} client{clients.length !== 1 ? 's' : ''} in your database</p>
        </div>
        <button className="btn btn-primary" id="btn-add-client" onClick={openCreate}>
          <Plus size={15} /> Add Client
        </button>
      </div>

      {error && !dialogOpen && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Search */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} />
          <input
            id="client-search"
            className="form-input"
            placeholder="Search clients..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={24} /></div>
          <div className="empty-state-title">No clients yet</div>
          <div className="empty-state-desc">Add your first client to start creating invoices.</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add Client</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tax Number</th>
                <th>Added</th>
                <th className="clients-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client._id} id={`client-row-${client._id}`}>
                  <td>
                    <div className="clients-info-cell">
                      <div className="client-avatar">{getInitials(client.name)}</div>
                      <div>
                        <div className="clients-name">{client.name}</div>
                        {client.address && (
                          <div className="clients-address-sub">
                            <MapPin size={10} />{client.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="clients-icon-cell">
                      <Mail size={12} />{client.email}
                    </div>
                  </td>
                  <td className="clients-text-secondary">
                    {client.phone ? (
                      <div className="clients-icon-cell">
                        <Phone size={12} />{client.phone}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="clients-text-muted">{client.taxNumber || '—'}</td>
                  <td className="clients-text-muted">{formatDate(client.createdAt)}</td>
                  <td>
                    <div className="table-actions clients-actions-cell">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(client)}>
                        <Edit2 size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => handleDelete(client._id)}>
                        <Trash2 size={14} />
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
        title={editing ? 'Edit Client' : 'New Client'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDialogOpen(false)}>Cancel</button>
            <button className="btn btn-primary" id="btn-save-client" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Client'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input id="client-name" className="form-input" placeholder="Acme Corp" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input id="client-email" className="form-input" type="email" placeholder="billing@acme.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input id="client-phone" className="form-input" placeholder="+1 555-0123" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax Number (VAT/GST)</label>
            <input id="client-tax" className="form-input" placeholder="GST-123456" value={form.taxNumber}
              onChange={e => setForm(f => ({ ...f, taxNumber: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea id="client-address" className="form-textarea" placeholder="123 Business Ave, City, Country" value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </Dialog>
    </div>
  );
}
