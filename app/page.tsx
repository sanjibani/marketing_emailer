'use client';

import Link from 'next/link';
import { getContacts, getTemplates, getCampaigns } from '@/lib/db';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, Mail, Zap, PauseCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const [data, setData] = useState<{
    contacts: any[];
    templates: any[];
    campaigns: any[];
    totalSent: number;
    openRate: number;
    clickRate: number;
    replies: number;
  }>({
    contacts: [],
    templates: [],
    campaigns: [],
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    replies: 0
  });

  const [loading, setLoading] = useState(true);

  // Mock data for charts
  const performanceData = [
    { name: 'Oct 01', value: 2400 },
    { name: 'Oct 05', value: 1398 },
    { name: 'Oct 10', value: 9800 },
    { name: 'Oct 15', value: 3908 },
    { name: 'Oct 20', value: 4800 },
    { name: 'Oct 25', value: 3800 },
    { name: 'Oct 30', value: 4300 },
  ];

  const chartData1 = Array.from({ length: 15 }, (_, i) => ({ value: Math.random() * 100 }));
  const chartData2 = Array.from({ length: 15 }, (_, i) => ({ value: Math.random() * 100 }));
  const chartData3 = Array.from({ length: 15 }, (_, i) => ({ value: Math.random() * 100 }));
  const chartData4 = Array.from({ length: 15 }, (_, i) => ({ value: Math.random() * 100 }));

  useEffect(() => {
    // In a real app we would fetch this via API, but for now we can simulate "client-side" DB read
    // or just fetch from the API endpoints we built earlier
    const loadData = async () => {
      try {
        const [campaignsRes, contactsRes] = await Promise.all([
          fetch('/api/campaigns'),
          fetch('/api/contacts'),
        ]);
        const campaigns = await campaignsRes.json();
        const contacts = await contactsRes.json();

        const sentCampaigns = campaigns.filter((c: any) => c.status === 'sent');
        const totalSent = sentCampaigns.reduce((sum: number, c: any) => sum + c.stats.sent, 0);

        // Mocking rates since we don't have real analytics backend yet
        setData({
          contacts,
          templates: [],
          campaigns,
          totalSent: totalSent || 12450, // Fallback to mock number for UI showcase if 0
          openRate: 42.8,
          clickRate: 12.1,
          replies: 342
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Performance Overview</h1>
          <p className="page-subtitle">Real-time engagement across all active outreach sequences.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span>Search campaigns...</span>
            <span style={{ fontSize: '10px' }}>⌘K</span>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          label="Total Sent"
          value={data.totalSent.toLocaleString()}
          trend="+5.2%"
          trendUp={true}
          data={chartData1}
          color="#0ea5e9"
        />
        <StatCard
          label="Open Rate"
          value={`${data.openRate}%`}
          trend="+1.4%"
          trendUp={true}
          data={chartData2}
          color="#22c55e"
        />
        <StatCard
          label="Click Rate"
          value={`${data.clickRate}%`}
          trend="-0.8%"
          trendUp={false}
          data={chartData3}
          color="#f43f5e"
        />
        <StatCard
          label="Replies"
          value={data.replies.toString()}
          trend="+12%"
          trendUp={true}
          data={chartData4}
          color="#8b5cf6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Campaign Velocity</div>
              <div className="page-subtitle">Engagement distribution over the last 30 days</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px' }}>
              <button style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--bg-tertiary)', color: 'white', fontSize: '0.85rem' }}>Daily</button>
              <button style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Weekly</button>
            </div>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                  itemStyle={{ color: 'white' }}
                />
                <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorVelocity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ActivityItem
              icon={<Mail size={16} color="white" />}
              iconColor="bg-emerald-500"
              title={<span><strong>Jordan Blake</strong> replied to <strong>Q4 Founders</strong></span>}
              time="2 minutes ago"
            />
            <ActivityItem
              icon={<Zap size={16} color="white" />}
              iconColor="bg-blue-500"
              title={<span>Campaign <strong>PLG Webinar</strong> reached 50% goal</span>}
              time="1 hour ago"
            />
            <ActivityItem
              icon={<PauseCircle size={16} color="white" />}
              iconColor="bg-amber-500"
              title={<span><strong>Enterprise Demo</strong> sequence was paused</span>}
              time="4 hours ago"
            />
            <ActivityItem
              icon={<Mail size={16} color="white" />}
              iconColor="bg-emerald-500"
              title={<span><strong>Sarah Chen</strong> clicked link in <strong>Intro Pitch</strong></span>}
              time="5 hours ago"
            />
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '24px' }}>View all activity</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Active Campaigns</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary btn-sm">Filter</button>
            <button className="btn btn-secondary btn-sm">Sort</button>
          </div>
        </div>
        <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 0 }}>Campaign Name</th>
                <th>Status</th>
                <th>Volume</th>
                <th>Engagement</th>
                <th style={{ textAlign: 'right', paddingRight: 0 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.slice(0, 5).map((campaign: any) => (
                <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ paddingLeft: 0, fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: campaign.status === 'sent' ? '#22c55e' : '#fbbf24' }}></div>
                      {campaign.name}
                    </div>
                  </td>
                  <td>
                    <span className={`status status-${campaign.status}`}>
                      {campaign.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>2,100</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Emails Sent</div>
                  </td>
                  <td style={{ width: '30%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Open Rate</span>
                      <span style={{ fontWeight: 600 }}>45%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                      <div style={{ width: '45%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 0 }}>
                    <button className="btn-icon" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.campaigns.length === 0 && (
            <div className="empty-state">No active campaigns found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, trendUp, data, color }: any) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-label">{label}</div>
        <div className={`stat-trend ${trendUp ? 'trend-up' : 'trend-down'}`}>
          {trend}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div style={{ height: '40px', marginTop: '12px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ActivityItem({ icon, iconColor, title, time }: any) {
  const colorMap: any = {
    'bg-emerald-500': '#10b981',
    'bg-blue-500': '#3b82f6',
    'bg-amber-500': '#f59e0b',
  };

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{
        minWidth: '32px', height: '32px',
        borderRadius: '50%',
        background: `${colorMap[iconColor]}20`, // 20% opacity hex
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: colorMap[iconColor]
      }}>
        {/* Clone element to override color prop if needed, or just wrap */}
        <div style={{ color: colorMap[iconColor] }}>{icon}</div>
      </div>
      <div>
        <div style={{ fontSize: '0.95rem', marginBottom: '4px', lineHeight: '1.4' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{time}</div>
      </div>
    </div>
  )
}
