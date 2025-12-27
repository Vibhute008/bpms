import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataService from '../../services/dataService';

export default function ClientDetails({ user, onLogout }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [client, setClient] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchClient = async () => {
      try {
        const clients = await DataService.getClients();
        const foundClient = clients.find(c => c.id === parseInt(clientId)) || {};
        setClient(foundClient);
      } catch (error) {
        console.error('Error fetching client:', error);
        setClient({});
      } finally {
        setLoading(false);
      }
    };
    
    fetchClient();
  }, [clientId]);

  // Empty data structure for factory projects
  const factoryProjects = [];

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Content */}
      <main>
        {/* Client Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{client.name || 'Client Details'}</h1>
              <p className="text-gray-600 mt-1">{client.company || ''}</p>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {user.factory} Factory
              </div>
            </div>
            <button
              onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/clients`)}
              className="mt-4 md:mt-0 inline-flex items-center text-indigo-600 hover:text-indigo-900"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Clients
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Client Details
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assigned Projects
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {factoryProjects.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Client Details Tab Content */}
        {activeTab === 'details' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Client Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Detailed information about the client.</p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Client Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.name || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.company || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.contactPerson || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.email || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.phone || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status || '-'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.address || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">GST Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.gst || '-'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Assigned Projects</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.projectsCount || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Projects Tab Content */}
        {activeTab === 'projects' && (
          <div>
            {factoryProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {factoryProjects.map((project) => {
                  const progressPercentage = project.totalQuantity > 0 ? Math.round((project.produced / project.totalQuantity) * 100) : 0;
                  const remaining = project.totalQuantity - project.produced;
                  
                  return (
                    <div key={project.id} className="bg-white shadow rounded-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString() : ''} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : ''}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(project.status)}`}>
                            {getStatusText(project.status)}
                          </span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {project.produced?.toLocaleString() || 0} / {project.totalQuantity?.toLocaleString() || 0} units
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <span className="font-medium">{remaining?.toLocaleString() || 0}</span> units remaining
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <button
                            onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/daily-entry`)}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Enter Production
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No assigned projects</h3>
                <p className="mt-1 text-gray-500">This client has no active projects assigned to your factory.</p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/clients`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Browse Other Clients
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Read-only notice */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Read-only Access</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You can view client and project information but cannot create, edit, or delete any data.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}