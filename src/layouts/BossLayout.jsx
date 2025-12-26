import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BossSidebar from '../components/BossSidebar';

export default function BossLayout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const location = useLocation();

  // Set active tab based on current route
  const getCurrentTab = () => {
    if (location.pathname.includes('client-management')) return 'clients';
    if (location.pathname.includes('project-management')) return 'projects';
    if (location.pathname.includes('production-overview')) return 'production';
    if (location.pathname.includes('invoice-billing')) return 'invoices';

    if (location.pathname.includes('settings')) return 'settings';
    return 'dashboard';
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Handle sidebar navigation
  const handleSidebarNavigation = (tabId) => {
    handleTabChange(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block flex-shrink-0 w-64">
        <BossSidebar 
          activeTab={getCurrentTab()}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
          user={user}
          setSidebarOpen={setSidebarOpen}
        />
      </div>

      {/* Mobile Sidebar - Hidden by default, shown when sidebarOpen is true */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex w-64">
            <BossSidebar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              activeTab={getCurrentTab()}
              onTabChange={handleSidebarNavigation}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile header with hamburger menu */}
        <header className="bg-white shadow-sm z-10 lg:hidden">
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