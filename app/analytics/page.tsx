'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Calendar, Download, RefreshCw, Info } from 'lucide-react';

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('30d');

    // Mock Data
    const timeseriesData = Array.from({ length: 30 }, (_, i) => ({
        date: `Oct ${i + 1}`,
        opens: Math.floor(Math.random() * 40) + 40,
        replies: Math.floor(Math.random() * 15) + 5,
    }));

    const subjectLineData = [
        { subject: '"Quick question about [Company] growth..."', rate: 68, type: 'HIGH' },
        { subject: '"Ideas for [Name] at [Company]"', rate: 52, type: 'MID' },
        { subject: '"Partnership opportunity?"', rate: 45, type: 'MID' },
        { subject: '"Are you the right person?"', rate: 38, type: 'LOW' },
    ];

    const conversionData = [
        { label: 'outreachflow.com/demo', clicks: 1240, signups: 82, cr: 6.6 },
        { label: 'calendly.com/alex/30min', clicks: 856, signups: 64, cr: 7.5 },
        { label: 'blog.outreachflow.com/case-study', clicks: 2100, signups: 45, cr: 2.1 },
    ];

    return (
        <div>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Detailed Analytics</h1>
                    <p className="page-subtitle">Performance tracking for your SaaS cold outreach campaigns.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary">
                        <Calendar size={16} style={{ marginRight: '8px' }} />
                        Last 30 Days: Oct 1 - Oct 30, 2023
                    </button>
                    <button className="btn btn-secondary">
                        <RefreshCw size={16} style={{ marginRight: '8px' }} />
                        Refresh
                    </button>
                    <button className="btn btn-primary">
                        <Download size={16} style={{ marginRight: '8px' }} />
                        Export Report
                    </button>
                </div>
            </header>

            <div className="stats-grid">
                <StatCard title="Total Sent" value="12,480" change="+12.4%" />
                <StatCard title="Open Rate" value="42.5%" change="+2.1%" color="text-green-400" />
                <StatCard title="Reply Rate" value="8.2%" change="-0.5%" isNegative />
                <StatCard title="Signup Rate" value="3.1%" change="+1.2%" color="text-green-400" />
            </div>

            <div className="card" style={{ marginBottom: '32px' }}>
                <div className="card-header">
                    <div>
                        <h3 className="card-title">Performance Over Time</h3>
                        <p className="page-subtitle">Engagement trends: Open Rates vs. Reply Rates</p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9' }}></div>
                            <span>Open Rate</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
                            <span>Reply Rate</span>
                        </div>
                    </div>
                </div>
                <div style={{ height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeseriesData}>
                            <defs>
                                <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} minTickGap={30} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }} />
                            <Area type="monotone" dataKey="opens" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorOpens)" />
                            <Area type="monotone" dataKey="replies" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorReplies)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="card">
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 className="card-title">Subject Line Performance</h3>
                            <Info size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {subjectLineData.map((item, i) => (
                            <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>{item.subject}</span>
                                    <span className={`status status-${item.type === 'HIGH' ? 'sent' : item.type === 'MID' ? 'scheduled' : 'draft'}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{item.type}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'flex-end' }}>
                                    {Array.from({ length: 10 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                flex: 1,
                                                background: idx < (item.rate / 10) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                height: '100%',
                                                opacity: idx < (item.rate / 10) ? 0.3 + (idx * 0.07) : 1,
                                                borderRadius: '2px'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Conversion Breakdown</h3>
                        <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>View All Links</a>
                    </div>
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: 0, paddingBottom: '12px', fontSize: '0.75rem' }}>LINK URL / GOAL</th>
                                <th style={{ fontSize: '0.75rem', textAlign: 'right' }}>CLICKS</th>
                                <th style={{ fontSize: '0.75rem', textAlign: 'right' }}>SIGNUPS</th>
                                <th style={{ fontSize: '0.75rem', textAlign: 'right', paddingRight: 0 }}>CR %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {conversionData.map((row, i) => (
                                <tr key={i} style={{ borderBottom: i === conversionData.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                    <td style={{ paddingLeft: 0, paddingTop: '16px', paddingBottom: '16px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{row.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Primary Call-to-Action</div>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.clicks}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)' }}>{row.signups}</td>
                                    <td style={{ textAlign: 'right', paddingRight: 0 }}>
                                        <span className="status status-sent" style={{ padding: '2px 8px' }}>{row.cr}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, isNegative }: any) {
    return (
        <div className="stat-card" style={{ height: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
                <div className={`stat-trend ${!isNegative ? 'trend-up' : 'trend-down'}`}>{change}</div>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', marginTop: '16px' }}>
                <div style={{ width: '60%', height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
            </div>
        </div>
    )
}
