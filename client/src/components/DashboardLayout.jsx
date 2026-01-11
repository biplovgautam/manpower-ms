import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout({
    children,
    role,
    userName,
    currentPath,
    onNavigate,
    onLogout
}) {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar - Persistent on the left */}
            <Sidebar
                role={role}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onLogout={onLogout}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Targeting the search elements specifically:
                  1. [&_input]:hidden hides the text field
                  2. [&_svg.text-gray-400]:hidden (or similar) targets common icon patterns
                  3. [&_.search-container]:hidden targets common class names
                */}
                <div className="[&_input]:hidden [&_svg]:first-of-type:hidden [&_.search-icon]:hidden">
                    <Header userName={userName} userRole={role} />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}