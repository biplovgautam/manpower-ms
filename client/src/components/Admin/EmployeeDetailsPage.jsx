"use client";

export function EmployeeDetailsPage({ employee, onBack }) {
    return (
        <div style={{ padding: '50px', background: 'white', minHeight: '100vh', width: '100%' }}>
            <button onClick={onBack} style={{ marginBottom: '20px', padding: '10px' }}>← Back</button>

            <h1 style={{ color: 'red', fontSize: '50px', fontWeight: 'bold', border: '5px solid red', padding: '20px' }}>
                IF YOU SEE THIS, THE CODE UPDATED
            </h1>

            <div style={{ marginTop: '30px' }}>
                <h2>Testing Tables Below:</h2>
                <table border="1" style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#eee' }}>
                        <tr>
                            <th>Employer Name</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Hardcoded Test Company</td>
                            <td>Visible</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}