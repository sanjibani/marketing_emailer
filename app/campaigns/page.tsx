'use client';

import { useState, useEffect } from 'react';
import { Plus, Send, Trash2, Users, FileText, Check, MoreHorizontal, Search, Filter } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    tags: string[];
}

interface Template {
    id: string;
    name: string;
    subject: string;
}

interface Campaign {
    id: string;
    name: string;
    templateId: string;
    contactIds: string[];
    status: 'draft' | 'scheduled' | 'sending' | 'sent';
    scheduledAt: string | null;
    sentAt: string | null;
    stats: {
        sent: number;
        opened: number;
        clicked: number;
    };
    createdAt: string;
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', templateId: '', contactIds: [] as string[] });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [campaignsRes, contactsRes, templatesRes] = await Promise.all([
                fetch('/api/campaigns'),
                fetch('/api/contacts'),
                fetch('/api/templates'),
            ]);
            setCampaigns(await campaignsRes.json());
            setContacts(await contactsRes.json());
            setTemplates(await templatesRes.json());
        } catch (error) {
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.contactIds.length === 0) {
            showToast('Please select at least one contact', 'error');
            return;
        }
        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                showToast('Campaign created successfully', 'success');
                setShowModal(false);
                setForm({ name: '', templateId: '', contactIds: [] });
                fetchData();
            }
        } catch (error) {
            showToast('Failed to create campaign', 'error');
        }
    };

    const handleSend = async (campaignId: string) => {
        if (!confirm('Are you sure you want to send this campaign now?')) return;

        setSending(campaignId);
        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Campaign sent! ${data.sent} emails delivered.`, 'success');
                fetchData();
            } else {
                showToast(data.error || 'Failed to send campaign', 'error');
            }
        } catch (error) {
            showToast('Failed to send campaign', 'error');
        } finally {
            setSending(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Campaign deleted', 'success');
                fetchData();
            }
        } catch (error) {
            showToast('Failed to delete campaign', 'error');
        }
    };

    const toggleContact = (contactId: string) => {
        setForm(prev => ({
            ...prev,
            contactIds: prev.contactIds.includes(contactId)
                ? prev.contactIds.filter(id => id !== contactId)
                : [...prev.contactIds, contactId],
        }));
    };

    const selectAllContacts = () => {
        setForm(prev => ({
            ...prev,
            contactIds: prev.contactIds.length === contacts.length ? [] : contacts.map(c => c.id),
        }));
    };

    const getTemplateName = (templateId: string) => {
        return templates.find(t => t.id === templateId)?.name || 'Unknown';
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <header className="page-header">
                <div>
                    <h1 className="page-title">Campaigns</h1>
                    <p className="page-subtitle">Create and manage your outreach sequences.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    New Campaign
                </button>
            </header>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input type="text" className="form-input" placeholder="Search campaigns..." style={{ paddingLeft: '36px' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-secondary btn-sm">
                            <Filter size={14} style={{ marginRight: '6px' }} />
                            Filter
                        </button>
                    </div>
                </div>

                {campaigns.length > 0 ? (
                    <div className="table-container" style={{ border: 'none', background: 'transparent' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: 0 }}>Campaign Name</th>
                                    <th>Template & Recipients</th>
                                    <th>Status</th>
                                    <th>Performance</th>
                                    <th style={{ textAlign: 'right', paddingRight: 0 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ paddingLeft: 0 }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{campaign.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Created {new Date(campaign.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                                    <FileText size={14} color="var(--text-secondary)" />
                                                    {getTemplateName(campaign.templateId)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <Users size={14} />
                                                    {campaign.contactIds.length} recipients
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status status-${campaign.status}`}>
                                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                            </span>
                                        </td>
                                        <td style={{ width: '25%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Delivered</span>
                                                <span style={{ fontWeight: 600 }}>{campaign.stats.sent}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
                                                <div style={{ width: `${Math.min(100, (campaign.stats.sent / Math.max(1, campaign.contactIds.length)) * 100)}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: 0 }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                {campaign.status === 'draft' && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{ padding: '6px 12px' }}
                                                        onClick={() => handleSend(campaign.id)}
                                                        disabled={sending === campaign.id}
                                                    >
                                                        {sending === campaign.id ? <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> : <Send size={14} />}
                                                        <span style={{ marginLeft: '6px' }}>Send</span>
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-secondary btn-icon"
                                                    style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    onClick={() => handleDelete(campaign.id)}
                                                >
                                                    <Trash2 size={14} color="var(--accent-danger)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Send size={48} strokeWidth={1} />
                        </div>
                        <div className="empty-state-title">No campaigns yet</div>
                        <p>Create your first campaign to start reaching your audience</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>
                            Create Campaign
                        </button>
                    </div>
                )}
            </div>

            {/* Create Campaign Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Create Campaign</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Campaign Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Q1 Product Launch"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Template *</label>
                                    {templates.length > 0 ? (
                                        <select
                                            className="form-select"
                                            value={form.templateId}
                                            onChange={e => setForm({ ...form, templateId: e.target.value })}
                                            required
                                        >
                                            <option value="">Select a template...</option>
                                            {templates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name} — {template.subject}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)' }}>No templates available. Create one first.</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <label className="form-label" style={{ margin: 0 }}>Select Recipients *</label>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={selectAllContacts}>
                                            <Check size={14} style={{ marginRight: '4px' }} />
                                            {form.contactIds.length === contacts.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    {contacts.length > 0 ? (
                                        <div style={{
                                            maxHeight: '240px',
                                            overflow: 'auto',
                                            background: 'var(--bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)',
                                            padding: '8px'
                                        }}>
                                            {contacts.map(contact => (
                                                <label
                                                    key={contact.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '10px 12px',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s',
                                                    }}
                                                    className="contact-item-hover"
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div className="checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            checked={form.contactIds.includes(contact.id)}
                                                            onChange={() => toggleContact(contact.id)}
                                                        />
                                                    </div>
                                                    <div style={{ marginLeft: '12px', flex: 1 }}>
                                                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{contact.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{contact.email}</div>
                                                    </div>
                                                    {contact.tags && contact.tags.length > 0 && (
                                                        <span className="tag" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                                                            {contact.tags[0]}
                                                        </span>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)' }}>No contacts available. Add some first.</p>
                                    )}
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.85rem' }}>
                                        Selected: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{form.contactIds.length}</span> contact(s)
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={templates.length === 0 || contacts.length === 0}
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? <Check size={18} /> : <div style={{ fontSize: '18px' }}>!</div>}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
