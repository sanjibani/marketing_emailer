'use client';

import { useState, useEffect } from 'react';

interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    country?: string;
    website?: string;
    niche?: string;
    tags: string[];
    source: string;
    campaigns: Array<{ id: string; name: string; status: string }>;
    hasBeenEmailed?: boolean;
    createdAt: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [form, setForm] = useState({ name: '', email: '', company: '', country: '', website: '', niche: '', tags: '' });
    const [csvText, setCsvText] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [filterCampaign, setFilterCampaign] = useState<string>('all');
    const [filterCountry, setFilterCountry] = useState<string>('all');
    const [filterNiche, setFilterNiche] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const res = await fetch('/api/contacts');
            const data = await res.json();
            setContacts(data);
        } catch (error) {
            showToast('Failed to load contacts', 'error');
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
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    company: form.company,
                    country: form.country,
                    website: form.website || null,
                    niche: form.niche || null,
                    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            if (res.ok) {
                showToast('Contact added successfully', 'success');
                setShowModal(false);
                setForm({ name: '', email: '', company: '', country: '', website: '', niche: '', tags: '' });
                fetchContacts();
            } else {
                showToast('Failed to add contact', 'error');
            }
        } catch (error) {
            showToast('Failed to add contact', 'error');
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const lines = csvText.trim().split('\n');
        let imported = 0;

        for (const line of lines) {
            const [name, email, company, country, tags] = line.split(',').map(s => s.trim());
            if (name && email) {
                try {
                    await fetch('/api/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name,
                            email,
                            company: company || '',
                            country: country || '',
                            tags: tags ? tags.split(';').map(t => t.trim()) : [],
                        }),
                    });
                    imported++;
                } catch (error) {
                    console.error('Import error:', error);
                }
            }
        }

        showToast(`Imported ${imported} contacts`, 'success');
        setShowImportModal(false);
        setCsvText('');
        fetchContacts();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Contact deleted', 'success');
                fetchContacts();
                if (selectedContact?.id === id) {
                    setShowDetailModal(false);
                    setSelectedContact(null);
                }
            }
        } catch (error) {
            showToast('Failed to delete contact', 'error');
        }
    };

    const openContactDetails = (contact: Contact) => {
        setSelectedContact(contact);
        setShowDetailModal(true);
    };

    // Helper to parse tags and extract notes
    const getParsedDetails = (contact: Contact) => {
        let notes = '';
        let cleanTags: string[] = [];

        contact.tags.forEach(tag => {
            if (tag.includes('| REASON:') || tag.includes('| NOTES:')) {
                const parts = tag.split(/\| (REASON|NOTES):/);
                if (parts[0].trim()) cleanTags.push(parts[0].trim());
                if (parts[2]) notes = parts[2].trim();
            } else if (tag.includes('NOTES:')) {
                const parts = tag.split('NOTES:');
                if (parts[0].trim()) cleanTags.push(parts[0].trim());
                notes = parts[1].trim();
            } else {
                cleanTags.push(tag);
            }
        });

        return { cleanTags, notes };
    };

    // Extract unique values for filter dropdowns
    const uniqueCampaigns = Array.from(new Set(
        contacts.flatMap(c => c.campaigns ? c.campaigns.map(camp => camp.name) : [])
    )).sort();

    const uniqueCountries = Array.from(new Set(
        contacts.map(c => c.country).filter((country): country is string => typeof country === 'string' && country.trim() !== '')
    )).sort();

    const uniqueNiches = Array.from(new Set(
        contacts.map(c => c.niche).filter((niche): niche is string => typeof niche === 'string' && niche.trim() !== '')
    )).sort();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ... existing useEffect ...

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCampaign, filterCountry, filterNiche, searchQuery]);

    // ... existing fetching ...

    const filteredContacts = contacts.filter(c => {
        const matchesCampaign = filterCampaign === 'all' || c.campaigns?.some(camp => camp.name === filterCampaign);
        const matchesCountry = filterCountry === 'all' || c.country === filterCountry;
        const matchesNiche = filterNiche === 'all' || c.niche === filterNiche;

        if (!matchesCampaign || !matchesCountry || !matchesNiche) return false;

        if (!searchQuery) return true;

        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.company || '').toLowerCase().includes(q) ||
            (c.country || '').toLowerCase().includes(q) ||
            (c.niche || '').toLowerCase().includes(q) ||
            (c.website || '').toLowerCase().includes(q) ||
            c.tags.some(tag => tag.toLowerCase().includes(q))
        );
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading) {
        // ... existing loading ...
    }

    const { cleanTags, notes } = selectedContact ? getParsedDetails(selectedContact) : { cleanTags: [], notes: '' };

    return (
        <div>
            {/* Headers and Actions */}
            {/* Filters Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {uniqueCampaigns.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Campaign:</label>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '13px' }}
                            value={filterCampaign}
                            onChange={(e) => setFilterCampaign(e.target.value)}
                        >
                            <option value="all">All ({contacts.length})</option>
                            {uniqueCampaigns.map(camp => (
                                <option key={camp} value={camp}>
                                    {camp} ({contacts.filter(c => c.campaigns?.some(cmp => cmp.name === camp)).length})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {uniqueCountries.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Country:</label>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '13px', maxWidth: '150px' }}
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                        >
                            <option value="all">All ({contacts.length})</option>
                            {uniqueCountries.map(country => (
                                <option key={country} value={country}>
                                    {country} ({contacts.filter(c => c.country === country).length})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {uniqueNiches.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>Niche:</label>
                        <select
                            className="form-select"
                            style={{ width: 'auto', padding: '6px 10px', fontSize: '13px', maxWidth: '150px' }}
                            value={filterNiche}
                            onChange={(e) => setFilterNiche(e.target.value)}
                        >
                            <option value="all">All ({contacts.length})</option>
                            {uniqueNiches.map(niche => (
                                <option key={niche} value={niche}>
                                    {niche} ({contacts.filter(c => c.niche === niche).length})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Universal Search Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="🔍 Search anything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '6px 12px', minWidth: '220px', fontSize: '13px' }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                    📥 Import CSV
                </button>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add Contact
                </button>
            </div>

            {filteredContacts.length > 0 ? (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ padding: '8px 12px' }}>Name</th>
                                <th style={{ padding: '8px 12px' }}>Email</th>
                                <th style={{ padding: '8px 12px' }}>Company</th>
                                <th style={{ padding: '8px 12px' }}>Niche</th>
                                <th style={{ padding: '8px 12px' }}>Website</th>
                                <th style={{ padding: '8px 12px' }}>Country</th>
                                <th style={{ padding: '8px 12px' }}>Sent?</th>
                                <th style={{ padding: '8px 12px' }}>Tags</th>
                                <th style={{ padding: '8px 12px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedContacts.map((contact) => {
                                const { cleanTags } = getParsedDetails(contact);
                                return (
                                    <tr
                                        key={contact.id}
                                        onClick={() => openContactDetails(contact)}
                                        style={{ cursor: 'pointer', height: '48px' }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td style={{ fontWeight: 500, color: 'var(--primary-color)', padding: '8px 12px' }}>
                                            {contact.name}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>{contact.email}</td>
                                        <td style={{ padding: '8px 12px' }}>{contact.company || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            {contact.niche ? (
                                                <span style={{ background: '#f0f4f8', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                    {contact.niche}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '8px 12px', maxWidth: '150px' }}>
                                            {contact.website ? (
                                                <a
                                                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title={contact.website} /* Hover expansion */
                                                    style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                >
                                                    {contact.website.replace(/^https?:\/\/(www\.)?/, '')}
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>{contact.country || '—'}</td>
                                        <td style={{ padding: '8px 12px' }}>
                                            {contact.hasBeenEmailed ? (
                                                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✓ Yes</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                {cleanTags.slice(0, 3).map((tag) => (
                                                    <span key={tag} className="tag tag-primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>{tag}</span>
                                                ))}
                                                {cleanTags.length > 3 && (
                                                    <span className="tag" style={{ background: '#eee', color: '#666', padding: '2px 8px', fontSize: '0.75rem' }}>
                                                        +{cleanTags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '8px 12px' }}>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={(e) => handleDelete(contact.id, e)}
                                                title="Delete Contact"
                                                style={{ padding: '4px 8px' }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {
                        totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )
                    }
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">No contacts found</div>
                        <p>Try adjusting your filters or add new contacts.</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>
                            Add Your First Contact
                        </button>
                    </div>
                </div>
            )}

            {/* Add Contact Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Add Contact</h2>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Name *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Company</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={form.company}
                                            onChange={e => setForm({ ...form, company: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={form.country}
                                            onChange={e => setForm({ ...form, country: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Website</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={form.website || ''}
                                            onChange={e => setForm({ ...form, website: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Niche</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={form.niche || ''}
                                            onChange={e => setForm({ ...form, niche: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="lead, saas, enterprise"
                                            value={form.tags}
                                            onChange={e => setForm({ ...form, tags: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Contact
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Import CSV Modal */}
            {
                showImportModal && (
                    <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Import Contacts</h2>
                                <button className="modal-close" onClick={() => setShowImportModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleImport}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">CSV Data</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="name,email,company,country,tags&#10;John Doe,john@example.com,Acme Corp,USA,lead;enterprise"
                                            value={csvText}
                                            onChange={e => setCsvText(e.target.value)}
                                            required
                                        />
                                        <small style={{ color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                                            Format: name,email,company,country,tags (tags separated by semicolons)
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Import
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Contact Detail Modal */}
            {
                showDetailModal && selectedContact && (
                    <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                        <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Contact Details</h2>
                                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                    <div style={{
                                        width: '64px', height: '64px',
                                        background: 'var(--primary-color)', color: 'white',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '24px', fontWeight: 'bold', marginRight: '16px'
                                    }}>
                                        {selectedContact.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '20px' }}>{selectedContact.name}</h3>
                                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{selectedContact.company}</p>
                                    </div>
                                </div>

                                <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>EMAIL</label>
                                        <div style={{ fontSize: '15px' }}>
                                            <a href={`mailto:${selectedContact.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                                                {selectedContact.email}
                                            </a>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>EMAIL SENT?</label>
                                        <div style={{ fontSize: '15px' }}>
                                            {selectedContact.hasBeenEmailed ? (
                                                <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✅ Yes</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>No</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedContact.country && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>COUNTRY</label>
                                        <div style={{ fontSize: '15px' }}>
                                            {selectedContact.country}
                                        </div>
                                    </div>
                                )}

                                {selectedContact.niche && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>NICHE</label>
                                        <div style={{ fontSize: '15px' }}>
                                            <span style={{ background: '#f0f4f8', color: '#334155', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 500 }}>
                                                {selectedContact.niche}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.website && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>WEBSITE</label>
                                        <div style={{ fontSize: '15px' }}>
                                            <a
                                                href={selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--primary-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                🔗 {selectedContact.website}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.campaigns && selectedContact.campaigns.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>ASSOCIATED CAMPAIGNS</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                            {selectedContact.campaigns.map(camp => (
                                                <span key={camp.id} className="tag" style={{
                                                    background: 'rgba(236, 72, 153, 0.1)',
                                                    color: '#db2777',
                                                    border: '1px solid rgba(236, 72, 153, 0.2)',
                                                    padding: '4px 10px'
                                                }}>
                                                    📌 {camp.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedContact.source.includes('http') && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>SOURCE URL</label>
                                        <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', fontSize: '13px' }}>
                                            <a
                                                href={selectedContact.source.split('|')[1]?.trim()}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--primary-color)', wordBreak: 'break-all' }}
                                            >
                                                {selectedContact.source.split('|')[1]?.trim()}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {cleanTags.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <label className="form-label" style={{ fontSize: '12px' }}>TAGS</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                            {cleanTags.map(tag => (
                                                <span key={tag} className="tag tag-primary" style={{ padding: '4px 10px' }}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {notes && (
                                    <div>
                                        <label className="form-label" style={{ fontSize: '12px' }}>AI ANALYSIS / NOTES</label>
                                        <div style={{
                                            background: '#fff8e6',
                                            border: '1px solid #fed7aa',
                                            borderRadius: '6px',
                                            padding: '12px',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            color: '#7c2d12',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                                <button
                                    className="btn btn-danger"
                                    onClick={(e) => handleDelete(selectedContact.id, e)}
                                >
                                    Delete Contact
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Toast */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}
        </div>
    );
}
// Add these snippets to globals.css if not present, but for now relying on existing styles
// If hover:bg-gray-50 isn't working, we might need inline style for tr:hover
