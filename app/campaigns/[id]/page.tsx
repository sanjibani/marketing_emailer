'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Mail, BarChart2, Calendar, Send } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    tags: string[];
    source: string;
}

interface CampaignDetail {
    id: string;
    name: string;
    status: string;
    scheduledAt: string | null;
    sentAt: string | null;
    template: {
        name: string;
        subject: string;
    };
    stats: {
        sent: number;
        opened: number;
        clicked: number;
    };
    contacts: Contact[];
}

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaign();
    }, []);

    const fetchCampaign = async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            if (res.ok) {
                const data = await res.json();
                setCampaign(data);
            } else {
                console.error('Failed to load campaign');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Grid 4x2

    // Pagination Logic
    const totalPages = campaign ? Math.ceil(campaign.contacts.length / itemsPerPage) : 0;
    const paginatedContacts = campaign
        ? campaign.contacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : [];

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!campaign) return <div className="p-8">Campaign not found</div>;

    return (
        <div>
            {/* ... header and stats ... */}
            <header className="page-header">
                {/* ... same header code ... */}
                <div>
                    <button
                        onClick={() => router.back()}
                        className="btn btn-secondary btn-sm"
                        style={{ marginBottom: '12px', paddingLeft: '8px' }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '4px' }} />
                        Back to Campaigns
                    </button>
                    <h1 className="page-title">{campaign.name}</h1>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <span className={`status status-${campaign.status}`}>
                            {campaign.status.toUpperCase()}
                        </span>
                        {campaign.sentAt && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                <Calendar size={14} style={{ marginRight: '6px' }} />
                                Sent on {new Date(campaign.sentAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Stats Overview - keep existing code */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Recipients</span>
                        <Users size={18} color="var(--primary-color)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{campaign.contacts.length}</div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Emails Sent</span>
                        <Send size={18} color="var(--accent-primary)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{campaign.stats?.sent || 0}</div>
                </div>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Open Rate</span>
                        <BarChart2 size={18} color="#10b981" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                        {campaign.stats?.sent ? Math.round((campaign.stats.opened / campaign.stats.sent) * 100) : 0}%
                    </div>
                </div>
            </div>

            {/* Leads Grid */}
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Targeted Leads</h2>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {currentPage} / {totalPages}
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{ padding: '4px 8px' }}
                                >
                                    Prev
                                </button>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '4px 8px' }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ padding: '24px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '20px'
                    }}>
                        {paginatedContacts.map(contact => (

                            <div key={contact.id} style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                padding: '16px',
                                background: 'var(--bg-tertiary)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'var(--primary-color)', color: 'white',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '16px', fontWeight: 'bold'
                                    }}>
                                        {contact.name.charAt(0)}
                                    </div>
                                    {contact.source.includes('verified') && (
                                        <span style={{ fontSize: '12px', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px' }}>
                                            Verified
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{contact.name}</h3>
                                <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{contact.company}</p>

                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                                    <Mail size={14} style={{ marginRight: '6px' }} />
                                    {contact.email}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {contact.tags.slice(0, 2).map((tag, i) => (
                                        <span key={i} className="tag tag-primary" style={{ fontSize: '0.75rem' }}>{tag}</span>
                                    ))}
                                    {contact.tags.length > 2 && (
                                        <span className="tag" style={{ fontSize: '0.75rem', background: '#eee', color: '#666' }}>+{contact.tags.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
