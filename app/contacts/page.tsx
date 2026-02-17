'use client';

import { useState, useEffect } from 'react';

interface Contact {
    id: string;
    name: string;
    email: string;
    company: string;
    tags: string[];
    createdAt: string;
}

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', company: '', tags: '' });
    const [csvText, setCsvText] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
                    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                }),
            });

            if (res.ok) {
                showToast('Contact added successfully', 'success');
                setShowModal(false);
                setForm({ name: '', email: '', company: '', tags: '' });
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
            const [name, email, company, tags] = line.split(',').map(s => s.trim());
            if (name && email) {
                try {
                    await fetch('/api/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name,
                            email,
                            company: company || '',
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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;

        try {
            const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Contact deleted', 'success');
                fetchContacts();
            }
        } catch (error) {
            showToast('Failed to delete contact', 'error');
        }
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
                    <h1 className="page-title">Contacts</h1>
                    <p className="page-subtitle">Manage your email recipients</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>
                        📥 Import CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Add Contact
                    </button>
                </div>
            </header>

            {contacts.length > 0 ? (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Company</th>
                                <th>Tags</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <tr key={contact.id}>
                                    <td style={{ fontWeight: 500 }}>{contact.name}</td>
                                    <td>{contact.email}</td>
                                    <td>{contact.company || '—'}</td>
                                    <td>
                                        {contact.tags.map((tag) => (
                                            <span key={tag} className="tag tag-primary">{tag}</span>
                                        ))}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(contact.id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">No contacts yet</div>
                        <p>Add contacts to start building your audience</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>
                            Add Your First Contact
                        </button>
                    </div>
                </div>
            )}

            {/* Add Contact Modal */}
            {showModal && (
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
            )}

            {/* Import CSV Modal */}
            {showImportModal && (
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
                                        placeholder="name,email,company,tags&#10;John Doe,john@example.com,Acme Corp,lead;enterprise"
                                        value={csvText}
                                        onChange={e => setCsvText(e.target.value)}
                                        required
                                    />
                                    <small style={{ color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                                        Format: name,email,company,tags (tags separated by semicolons)
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
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}
        </div>
    );
}
