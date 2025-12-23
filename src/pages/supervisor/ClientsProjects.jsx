import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const mockClients = [
  { id: 1, name: 'ABC Publishers', company: 'ABC Publishing House' },
  { id: 2, name: 'XYZ Books', company: 'XYZ Educational Solutions' },
  { id: 3, name: 'DEF Publications', company: 'DEF Media Group' },
  { id: 4, name: 'GHI Printers', company: 'GHI Printing Services' }
];

const mockProjects = [
  { id: 1, name: 'English Grammar Book', subject: 'English', language: 'English', totalQuantity: 50000, produced: 25000, startDate: '2023-01-15', endDate: '2023-03-30', factory: 'Mahape', status: 'ongoing' },
  { id: 2, name: 'Mathematics Workbook', subject: 'Mathematics', language: 'Hindi', totalQuantity: 75000, produced: 30000, startDate: '2023-02-01', endDate: '2023-04-15', factory: 'Taloja', status: 'ongoing' },
  { id: 3, name: 'Science Reader', subject: 'Science', language: 'Marathi', totalQuantity: 30000, produced: 15000, startDate: '2023-01-10', endDate: '2023-03-20', factory: 'Mahape', status: 'ongoing' },
  { id: 4, name: 'Social Studies Guide', subject: 'Social Studies', language: 'English', totalQuantity: 40000, produced: 0, startDate: '2023-03-01', endDate: '2023-05-15', factory: 'Taloja', status: 'ongoing' }
];

export default function ClientsProjects({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' or 'projects'
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Filter clients based on search term
  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter projects for this supervisor's factory
  const factoryProjects = mockProjects.filter(project => project.factory === user.factory && project.status === 'ongoing');

  const handleSelectClient = (clientId) => {
    // In a real app, this would show client details
    // For now, we'll just show a toast
    if (typeof window.addToast === 'function') {
      window.addToast('Client selected', 'info');
    }
  };

  const handleSelectProject = (projectId) => {
    // Store the selected project ID in localStorage for the daily entry page
    localStorage.setItem('selectedProjectId', projectId);
    navigate(`/supervisor/${user.factory.toLowerCase()}/daily-entry`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">📋 Clients & Projects</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline">Supervisor • {user.factory}</span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Clients & Projects</h2>
          <p className="mt-1 text-gray-600">Manage clients and select projects for production entry</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Clients
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {mockClients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Projects
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {factoryProjects.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            {filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                  <div 
                    key={client.id} 
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectClient(client.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{client.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{client.company}</p>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No clients found</h3>
                <p className="mt-1 text-gray-500">No clients match your search term "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            {factoryProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {factoryProjects.map(project => {
                  const progressPercentage = Math.round((project.produced / project.totalQuantity) * 100);
                  return (
                    <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <p className="text-gray-600 mt-1">{project.subject} • {project.language}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Ongoing
                          </span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-medium text-gray-700">
                              {project.produced.toLocaleString()} / {project.totalQuantity.toLocaleString()} units
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{width: `${progressPercentage}%`}}
                            ></div>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {progressPercentage}% completed
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            Ends: {new Date(project.endDate).toLocaleDateString()}
                          </div>
                          <Button
                            onClick={() => handleSelectProject(project.id)}
                            variant="primary"
                          >
                            Enter Production
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No ongoing projects</h3>
                <p className="mt-1 text-gray-500">There are no active projects assigned to {user.factory} factory</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <Button 
            onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/production-view`)}
            variant="secondary"
          >
            ← Back to Production View
          </Button>
        </div>
      </main>
    </div>
  );
}