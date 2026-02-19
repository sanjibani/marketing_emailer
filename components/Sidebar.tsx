'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Send, PieChart, Workflow, Settings, Zap, LogIn, LogOut } from 'lucide-react';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/campaigns', label: 'Campaigns', icon: Send },
        { href: '/contacts', label: 'Leads', icon: Users },
        { href: '/templates', label: 'Templates', icon: FileText },
        { href: '/analytics', label: 'Analytics', icon: PieChart },
        { href: '/automation', label: 'Automation', icon: Zap },
        { href: '/settings', label: 'Settings', icon: Settings },
    ];

    if (pathname === '/login') return null;

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Send size={20} color="white" fill="white" style={{ transform: 'rotate(-45deg)' }} />
                </div>
                ColdReach AI
            </div>

            <div style={{ marginBottom: '24px', paddingLeft: '18px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                MAIN MENU
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                {status === 'loading' ? (
                    <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : session ? (
                    <div className="card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            {session.user?.image ? (
                                <img src={session.user.image} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                            ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{session.user?.name?.[0] || 'U'}</span>
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.email}</div>
                            </div>
                            <button onClick={() => signOut()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '16px' }}>
                        <button onClick={() => signIn('google')} style={{
                            width: '100%',
                            padding: '10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <LogIn size={16} />
                            Sign In with Google
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
