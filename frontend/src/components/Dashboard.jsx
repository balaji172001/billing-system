import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, FileText, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { getAnalytics } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import './Dashboard.css';

const PIE_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b', '#6366f1'];

function StatCard({ icon: Icon, label, value, sub, variantClass, id }) {
  return (
    <div className={`stat-card ${variantClass}`} id={id}>
      <div className="stat-card-icon">
        <Icon size={18} />
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="dashboard-tooltip">
        <p className="dashboard-tooltip-label">{label}</p>
        <p className="dashboard-tooltip-value">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error"><AlertTriangle size={15} />{error}</div>;
  if (!data) return null;

  const { summary, revenueTrends, statusBreakdown, topClients, recentPayments, overdueInvoices } = data;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial overview and key metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard
          id="kpi-revenue"
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          sub="Collected payments"
          variantClass="stat-card-mint"
        />
        <StatCard
          id="kpi-outstanding"
          icon={TrendingUp}
          label="Outstanding"
          value={formatCurrency(summary.totalOutstanding)}
          sub="Awaiting payment"
          variantClass="stat-card-amber"
        />
        <StatCard
          id="kpi-invoices"
          icon={FileText}
          label="Total Invoices"
          value={summary.totalInvoices}
          sub="All time"
          variantClass="stat-card-cyan"
        />
        <StatCard
          id="kpi-clients"
          icon={Users}
          label="Active Clients"
          value={summary.activeClients}
          sub="In database"
          variantClass="stat-card-violet"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Revenue Trend */}
        <div className="card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Revenue Trend</div>
              <div className="chart-subtitle">Last 6 months invoiced</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrends} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#06b6d4', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#06b6d4' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie */}
        <div className="card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Invoice Status</div>
              <div className="chart-subtitle">Distribution breakdown</div>
            </div>
          </div>
          {statusBreakdown.length === 0 ? (
            <div className="empty-state dashboard-empty-pie">
              <div className="empty-state-title">No data yet</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(val) => <span className="dashboard-pie-legend-item">{val}</span>}
                  iconType="circle"
                  iconSize={8}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="dashboard-bottom-grid">
        {/* Top Clients */}
        <div className="card">
          <div className="section-title">Top Clients</div>
          {topClients.length === 0 ? (
            <div className="empty-state dashboard-empty-card">
              <span className="empty-state-title">No clients billed yet</span>
            </div>
          ) : (
            topClients.map((c, i) => (
              <div className="client-rank" key={i}>
                <div className="client-avatar">{c.name[0]}</div>
                <div>
                  <div className="client-rank-name">{c.name}</div>
                </div>
                <div className="client-rank-amount">{formatCurrency(c.billed)}</div>
              </div>
            ))
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="section-title">Recent Payments</div>
          {recentPayments.length === 0 ? (
            <div className="empty-state dashboard-empty-card">
              <span className="empty-state-title">No payments recorded</span>
            </div>
          ) : (
            recentPayments.map((p, i) => (
              <div className="client-rank" key={i}>
                <div className="client-avatar dashboard-avatar-mint">
                  $
                </div>
                <div>
                  <div className="client-rank-name">{p.invoice?.invoiceNumber || '—'}</div>
                  <div className="dashboard-recent-subtext">
                    {p.invoice?.client?.name || ''} · {formatDate(p.date)}
                  </div>
                </div>
                <div className="client-rank-amount">{formatCurrency(p.amount)}</div>
              </div>
            ))
          )}
        </div>

        {/* Overdue Invoices */}
        <div className="card">
          <div className="section-title dashboard-overdue-title">
            <AlertTriangle size={15} className="dashboard-overdue-icon" />
            Overdue Alerts
          </div>
          {overdueInvoices.length === 0 ? (
            <div className="empty-state dashboard-empty-card">
              <span className="empty-state-title dashboard-empty-mint">All clear ✓</span>
            </div>
          ) : (
            overdueInvoices.map((inv, i) => (
              <div className="overdue-item" key={i}>
                <div className="overdue-dot" />
                <div className="overdue-info">
                  <div className="overdue-num">{inv.invoiceNumber}</div>
                  <div className="overdue-client">{inv.client?.name || '—'} · Due {formatDate(inv.dueDate)}</div>
                </div>
                <div className="overdue-amount">{formatCurrency(inv.grandTotal - inv.amountPaid)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
