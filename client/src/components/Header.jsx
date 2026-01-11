import { Bell, Search } from 'lucide-react';

export function Header({
    userName,
    userRole,
    showSearch = true // Default to true so it doesn't break other pages
}) {
    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
                {/* Conditional Search Bar */}
                <div className="flex items-center gap-4 flex-1 max-w-xl">
                    {showSearch && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Bell size={20} />
                    </button>

                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{userRole || 'Role'}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {(userName || 'U').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}