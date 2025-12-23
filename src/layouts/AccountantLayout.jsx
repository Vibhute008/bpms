import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AccountantSidebar from '../components/AccountantSidebar';

export default function AccountantLayout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Set active tab based on current route
  const getCurrentTab = () => {
    if (location.pathname.includes('production-view')) return 'production';
    if (location.pathname.includes('project-management')) return 'projects';
    if (location.pathname.includes('client-management')) return 'clients';
    return 'production'; // Default to production view instead of dashboard
  };

  const handleTabChange = (tabId) => {
    // Navigate to respective pages
    switch(tabId) {
      case 'production':
        navigate('/accountant/production-view');
        break;
      case 'projects':
        navigate('/accountant/project-management');
        break;
      case 'clients':
        navigate('/accountant/client-management');
        break;
      default:
        navigate('/accountant/production-view'); // Default to production view instead of dashboard
    }
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 w-64">
        <AccountantSidebar 
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
            <AccountantSidebar 
              sidebarOpen={sidebarOpen} 
              setSidebarOpen={setSidebarOpen}
              activeTab={getCurrentTab()}
              onTabChange={handleTabChange}
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
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}