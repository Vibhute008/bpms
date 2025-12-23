import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../../services/dataService';

export default function ClientList({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientData = await DataService.getClients();
        setClients(clientData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectClient = (clientId) => {
    // In a real app, this would navigate to client details
    navigate(`/supervisor/${user.factory.toLowerCase()}/client-details/${clientId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Client Directory</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="form-input pl-10 pr-4"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Clients Table - Similar to Boss layout but read-only */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-1/6">Client Name</th>
                  <th className="w-1/6">Company</th>
                  <th className="w-1/6">Contact Person</th>
                  <th className="w-1/6">Phone</th>
                  <th className="w-1/6">Status</th>
                  <th className="w-1/6 text-right">View Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleSelectClient(client.id)}>
                      <td>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-gray-500 text-sm">{client.email}</div>
                      </td>
                      <td>{client.company}</td>
                      <td>{client.contactPerson}</td>
                      <td>{client.phone}</td>
                      <td>
                        <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClient(client.id);
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No clients found</h3>
                        <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
        
        {/* Read-only notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Read-only Access</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You can view client information but cannot create, edit, or delete clients.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}