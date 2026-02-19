'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Send, Clock, CheckCircle, XCircle, Calendar, RefreshCw, StopCircle, Play, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    status: string;
    recipients: { contactId: string }[];
}

interface ScheduledEmail {
    id: string;
    campaignId: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
    scheduledAt: string;
    sentAt: string | null;
    error: string | null;
    contact: { name: string; email: string; company: string };
    campaign: { name: string; status: string };
}

interface QueueCounts {
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    sent: '#10b981',
    failed: '#ef4444',
    cancelled: '#6b7280',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock size={14} />,
    sent: <CheckCircle size={14} />,
    failed: <XCircle size={14} />,
    cancelled: <StopCircle size={14} />,
};

const PAGE_SIZE = 10;

export default function AutomationPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [queue, setQueue] = useState<ScheduledEmail[]>([]);
    const [counts, setCounts] = useState<QueueCounts>({ pending: 0, sent: 0, failed: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [scheduling, setScheduling] = useState(false);
    const [ticking, setTicking] = useState(false);
    const [scheduleResult, setScheduleResult] = useState<{ scheduled: number; startTime: string; estimatedFinish: string } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [filterCampaignId, setFilterCampaignId] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [autoTick, setAutoTick] = useState(false);
    const [tickResult, setTickResult] = useState<{ processed: number; sent: number; failed: number } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('/api/campaigns');
            const data = await res.json();
            setCampaigns(data);
            if (data.length > 0 && !selectedCampaignId) {
                setSelectedCampaignId(data[0].id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchQueue = useCallback(async () => {
        try {
            const url = filterCampaignId
                ? `/api/automation/queue?campaignId=${filterCampaignId}`
                : '/api/automation/queue';
            const res = await fetch(url);
            const data = await res.json();
            setQueue(data.queue || []);
            setCounts(data.counts || { pending: 0, sent: 0, failed: 0, cancelled: 0 });
        } catch (e) {
            console.error(e);
        }
    }, [filterCampaignId]);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchCampaigns(), fetchQueue()]);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => { fetchQueue(); }, [filterCampaignId, fetchQueue]);

    // Auto-tick polling every 30s when enabled
    useEffect(() => {
        if (!autoTick) return;
        const tick = () => runCronTick(true);
        tick();
        const interval = setInterval(tick, 30000);
        return () => clearInterval(interval);
    }, [autoTick]);

    const runCronTick = async (silent = false) => {
        setTicking(true);
        try {
            const res = await fetch('/api/automation/cron-tick');
            const data = await res.json();
            setTickResult(data);
            await fetchQueue();
            if (!silent && data.processed > 0) {
                showToast(`✅ Sent ${data.sent} email${data.sent !== 1 ? 's' : ''} this tick`, 'success');
            } else if (!silent) {
                showToast('No emails were due yet', 'success');
            }
        } catch (e) {
            if (!silent) showToast('Cron tick failed', 'error');
        } finally {
            setTicking(false);
        }
    };

    const handleSchedule = async () => {
        if (!selectedCampaignId) return;
        setScheduling(true);
        setScheduleResult(null);
        try {
            const res = await fetch('/api/automation/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: selectedCampaignId }),
            });
            const data = await res.json();
            if (res.ok) {
                setScheduleResult(data);
                showToast(`Scheduled ${data.scheduled} emails starting from ${new Date(data.startTime).toLocaleTimeString()}`, 'success');
                await fetchQueue();
                await fetchCampaigns();
            } else {
                showToast(data.error || 'Scheduling failed', 'error');
            }
        } catch (e) {
            showToast('Scheduling failed', 'error');
        } finally {
            setScheduling(false);
        }
    };

    const handleCancel = async (campaignId: string) => {
        if (!confirm('Cancel all pending emails for this campaign?')) return;
        try {
            await fetch(`/api/automation/queue?campaignId=${campaignId}`, { method: 'DELETE' });
            showToast('Pending emails cancelled', 'success');
            await fetchQueue();
            await fetchCampaigns();
        } catch (e) {
            showToast('Failed to cancel', 'error');
        }
    };

    // Filtered + paginated queue
    const filteredQueue = queue.filter(e => {
        if (filterStatus !== 'all' && e.status !== filterStatus) return false;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filteredQueue.length / PAGE_SIZE));
    const pagedQueue = filteredQueue.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Automation</h1>
                    <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} />
                        Smart scheduling — emails sent 1 PM–6 PM IST with random delays to stay under Zoho's radar
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: autoTick ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)',
                        border: `1px solid ${autoTick ? '#10b981' : 'var(--border-color)'}`,
                        borderRadius: '8px', padding: '8px 14px', cursor: 'pointer'
                    }} onClick={() => setAutoTick(!autoTick)}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: autoTick ? '#10b981' : '#6b7280',
                            boxShadow: autoTick ? '0 0 6px #10b981' : 'none',
                            animation: autoTick ? 'pulse 2s infinite' : 'none'
                        }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: autoTick ? '#10b981' : 'var(--text-secondary)' }}>
                            {autoTick ? 'Auto-Send ON' : 'Auto-Send OFF'}
                        </span>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={() => runCronTick(false)}
                        disabled={ticking}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={16} style={{ animation: ticking ? 'spin 1s linear infinite' : 'none' }} />
                        {ticking ? 'Sending…' : 'Tick Now'}
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Pending', value: counts.pending, color: '#f59e0b', icon: <Clock size={20} /> },
                    { label: 'Sent', value: counts.sent, color: '#10b981', icon: <CheckCircle size={20} /> },
                    { label: 'Failed', value: counts.failed, color: '#ef4444', icon: <XCircle size={20} /> },
                    { label: 'Cancelled', value: counts.cancelled, color: '#6b7280', icon: <StopCircle size={20} /> },
                ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stat.label}</span>
                            <span style={{ color: stat.color }}>{stat.icon}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '28px' }}>
                {/* Schedule Panel */}
                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                        Schedule a Campaign
                    </h2>

                    <div className="form-group">
                        <label className="form-label">Select Campaign</label>
                        <select
                            className="form-select"
                            value={selectedCampaignId}
                            onChange={e => setSelectedCampaignId(e.target.value)}
                        >
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
                            ))}
                        </select>
                    </div>

                    {selectedCampaign && (
                        <div style={{
                            background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px',
                            marginBottom: '16px', fontSize: '0.85rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Recipients</span>
                                <strong>{selectedCampaign.recipients?.length || 0} contacts</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Send Window</span>
                                <strong>1:00 PM – 6:00 PM IST</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Delay per email</span>
                                <strong>3–12 min random</strong>
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleSchedule}
                        disabled={scheduling || !selectedCampaignId}
                    >
                        <Zap size={16} />
                        {scheduling ? 'Scheduling…' : 'Schedule Smart Send'}
                    </button>

                    {scheduleResult && (
                        <div style={{
                            marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981', borderRadius: '8px', padding: '12px', fontSize: '0.85rem'
                        }}>
                            <div style={{ fontWeight: 600, color: '#10b981', marginBottom: '6px' }}>
                                ✅ {scheduleResult.scheduled} emails scheduled
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                Starts: {new Date(scheduleResult.startTime).toLocaleString('en-IN')}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                Finishes: {new Date(scheduleResult.estimatedFinish).toLocaleString('en-IN')}
                            </div>
                        </div>
                    )}
                </div>

                {/* How it works */}
                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={18} style={{ color: 'var(--primary-color)' }} />
                        Anti-Spam Strategy
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                            { title: '🕐 Business Hours Only', desc: 'All emails scheduled between 1 PM and 6 PM IST — when humans actually send emails' },
                            { title: '⏱️ Random Delays', desc: '3–12 minute random gaps between each email to mimic natural sending cadence' },
                            { title: '✍️ Personalized Content', desc: 'Every email uses {{name}}, {{company}} tokens so they look individually written' },
                            { title: '📊 Max 25/hr Cap', desc: 'Even large campaigns spread across multiple days to stay well under Zoho limits' },
                        ].map(item => (
                            <div key={item.title} style={{
                                background: 'var(--bg-tertiary)', borderRadius: '8px',
                                padding: '14px', fontSize: '0.85rem'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{item.title}</div>
                                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    {tickResult && (
                        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>Last Tick Result</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Processed: {tickResult.processed} &nbsp;|&nbsp;
                                Sent: <span style={{ color: '#10b981' }}>{tickResult.sent}</span> &nbsp;|&nbsp;
                                Failed: <span style={{ color: '#ef4444' }}>{tickResult.failed}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Queue Table */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Email Queue</h2>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                            value={filterCampaignId}
                            onChange={e => { setFilterCampaignId(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                            value={filterStatus}
                            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        {filterCampaignId && counts.pending > 0 && (
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancel(filterCampaignId)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <StopCircle size={14} /> Cancel Pending
                            </button>
                        )}
                    </div>
                </div>

                {pagedQueue.length > 0 ? (
                    <>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ padding: '8px 12px' }}>Recipient</th>
                                    <th style={{ padding: '8px 12px' }}>Campaign</th>
                                    <th style={{ padding: '8px 12px' }}>Status</th>
                                    <th style={{ padding: '8px 12px' }}>Scheduled At (IST)</th>
                                    <th style={{ padding: '8px 12px' }}>Sent At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedQueue.map(email => (
                                    <tr key={email.id} style={{ height: '46px', borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px 12px' }}>
                                            <div style={{ fontWeight: 500 }}>{email.contact.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{email.contact.email}</div>
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.85rem' }}>{email.campaign.name}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                background: `${STATUS_COLORS[email.status]}20`,
                                                color: STATUS_COLORS[email.status],
                                            }}>
                                                {STATUS_ICONS[email.status]}
                                                {email.status}
                                            </span>
                                            {email.error && (
                                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }} title={email.error}>
                                                    ⚠️ {email.error.substring(0, 40)}…
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                            {new Date(email.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                        </td>
                                        <td style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {email.sentAt
                                                ? new Date(email.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    Page {currentPage} of {totalPages} &nbsp;({filteredQueue.length} total)
                                </span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Zap size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>No emails in queue</div>
                        <p style={{ fontSize: '0.9rem' }}>Schedule a campaign above to get started.</p>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
