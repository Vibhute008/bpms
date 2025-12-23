import { useNavigate } from 'react-router-dom';

export default function SupervisorSidebar({ activeTab, onTabChange, onClose, factory, onLogout, user }) {
  const navigate = useNavigate();
  
  // Determine the base path based on factory
  const basePath = factory ? `/supervisor/${factory.toLowerCase()}` : '/supervisor';
  
  const menuItems = [
    { 
      id: 'clients', 
      name: 'Clients', 
      path: `${basePath}/clients`,
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ) 
    },
    { 
      id: 'projects', 
      name: 'Projects', 
      path: `${basePath}/projects`,
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ) 
    },
    { 
      id: 'production-view', 
      name: 'Production View', 
      path: `${basePath}/production-view`,
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2V6a2 2 0 00-2-2h-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 12a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-2-2h-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 20a2 2 0 00-2 2v1a2 2 0 002 2h2a2 2 0 002-2v-1a2 2 0 00-2-2h-2z" />
        </svg>
      ) 
    }
  ];

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const handleMenuClick = (item) => {
    onTabChange(item.id);
    navigate(item.path);
    // Call onClose if provided (for mobile sidebar)
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-xl text-white">📚</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">BPMS</h1>
            {factory && (
              <p className="text-xs font-medium text-indigo-600">{factory} Factory</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-5">
        <nav className="px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 justify-start transform hover:translate-x-1 ${
                  activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                <span className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-gray-500">
                  {item.icon}
                </span>
                <span className="ml-4">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl w-12 h-12 flex items-center justify-center shadow-md ring-4 ring-blue-100">
                  <span className="text-white font-bold text-xl">
                    S
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-lg font-bold text-gray-900">Factory Manager</p>
                <p className="text-sm text-gray-600">{factory} Factory</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 shadow-md text-white flex items-center justify-center transform hover:scale-[1.02] active:scale-95"
              title="Logout from system"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
       
      </div>
    </div>
  );
}