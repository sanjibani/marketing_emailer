'use client';

import { signIn, useSession } from "next-auth/react";
import { Send } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Loading...</div>;
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
        }}>
            <div className="card" style={{
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                }}>
                    <Send size={32} color="white" fill="white" style={{ transform: 'rotate(-45deg)' }} />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Sign in to manage your campaigns</p>
                </div>

                <button
                    onClick={async () => {
                        console.log("Sign in button clicked");
                        try {
                            const result = await signIn('google', { callbackUrl: '/' });
                            console.log("Sign in result:", result);
                        } catch (error) {
                            console.error("Sign in error:", error);
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: 'white',
                        color: 'black',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'background 0.2s'
                    }}
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '20px', height: '20px' }} />
                    Sign in with Google
                </button>
            </div>

            <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                &copy; {new Date().getFullYear()} ColdReach AI. All rights reserved.
            </p>
        </div>
    );
}
