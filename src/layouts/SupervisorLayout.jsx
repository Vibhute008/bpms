import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SupervisorSidebar from '../components/SupervisorSidebar';

export default function SupervisorLayout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Set active tab based on current route
  const getCurrentTab = () => {
    if (location.pathname.includes('clients')) return 'clients';
    if (location.pathname.includes('projects')) return 'projects';
    if (location.pathname.includes('production-view')) return 'production-view';
    return 'production-view'; // Default to production view
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Handle sidebar navigation
  const handleSidebarNavigation = (tabId) => {
    // Close mobile sidebar after navigation
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Always visible on medium screens and up */}
      <div className="hidden md:block flex-shrink-0 w-64">
        <SupervisorSidebar 
          activeTab={getCurrentTab()}
          onTabChange={handleSidebarNavigation}
          factory={user.factory}
          onLogout={handleLogout}
          user={user}
        />
      </div>

      {/* Mobile Sidebar - Hidden by default, shown when sidebarOpen is true */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-y-0 left-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex w-64">
            <SupervisorSidebar 
              activeTab={getCurrentTab()}
              onTabChange={handleSidebarNavigation}
              onClose={() => setSidebarOpen(false)}
              factory={user.factory}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="bg-white shadow-sm z-10 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                type="button"
                className="text-gray-500 focus:outline-none"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900 capitalize">
                {getCurrentTab().replace('-', ' ')}
              </h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}