// client/src/app/page.js (UPDATED)

import Link from 'next/link';

export default function Home() {
    return (
        <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Manpower Management System Frontend (Client)</h1>
            <p>This is the Next.js application running locally.</p>
            <p>The backend API base URL is configured via environment variables.</p>

            <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #0070f3', borderRadius: '8px', backgroundColor: '#f0f8ff' }}>
                <h2>Authentication Status</h2>
                <p>The Login and Register components are fully implemented and connected to the backend API via Axios.</p>

                <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
                    <Link href="/login" style={{
                        padding: '10px 20px',
                        backgroundColor: '#0070f3',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        fontWeight: 'bold'
                    }}>
                        Go to Login
                    </Link>

                    <Link href="/register" style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px',
                        fontWeight: 'bold'
                    }}>
                        Go to Register
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <h2>Monorepo Status</h2>
                <p>Client: Operational (Next.js)</p>
                <p>Server: Operational (Node/Express/MongoDB) with Auth Routes active.</p>
            </div>

        </div>
    );
}