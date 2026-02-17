'use client';

import { useState, useEffect } from 'react';

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    createdAt: string;
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [form, setForm] = useState({ name: '', subject: '', body: '' });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            showToast('Failed to load templates', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openCreateModal = () => {
        setEditingTemplate(null);
        setForm({ name: '', subject: '', body: '' });
        setShowModal(true);
    };

    const openEditModal = (template: Template) => {
        setEditingTemplate(template);
        setForm({ name: template.name, subject: template.subject, body: template.body });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate) {
                const res = await fetch('/api/templates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingTemplate.id, ...form }),
                });
                if (res.ok) {
                    showToast('Template updated', 'success');
                }
            } else {
                const res = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });
                if (res.ok) {
                    showToast('Template created', 'success');
                }
            }
            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            showToast('Failed to save template', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            const res = await fetch(`/api/templates?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Template deleted', 'success');
                fetchTemplates();
            }
        } catch (error) {
            showToast('Failed to delete template', 'error');
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
                    <h1 className="page-title">Templates</h1>
                    <p className="page-subtitle">Create and manage email templates</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    ➕ New Template
                </button>
            </header>

            <div style={{
                background: 'var(--bg-tertiary)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                border: '1px solid var(--border)'
            }}>
                <strong>💡 Personalization Tokens:</strong>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>
                    Use <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>{'{{name}}'}</code>,
                    <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{'{{company}}'}</code>,
                    <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{'{{email}}'}</code>
                    in your templates
                </span>
            </div>

            {templates.length > 0 ? (
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                    {templates.map((template) => (
                        <div key={template.id} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{template.name}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(template)}>
                                        ✏️
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(template.id)}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>
                                <strong>Subject:</strong> {template.subject}
                            </div>
                            <div
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.85rem',
                                    maxHeight: '100px',
                                    overflow: 'hidden',
                                    color: 'var(--text-secondary)'
                                }}
                                dangerouslySetInnerHTML={{ __html: template.body.substring(0, 200) + '...' }}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <div className="empty-state-title">No templates yet</div>
                        <p>Create email templates with personalization</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={openCreateModal}>
                            Create Your First Template
                        </button>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Template Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Welcome Email"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject Line *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Hey {{name}}, check this out!"
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email Body (HTML) *</label>
                                    <textarea
                                        className="form-textarea"
                                        style={{ minHeight: '200px' }}
                                        placeholder="<h1>Hello {{name}}!</h1><p>Your email content here...</p>"
                                        value={form.body}
                                        onChange={e => setForm({ ...form, body: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}
        </div>
    );
}
