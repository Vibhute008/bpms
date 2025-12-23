import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/CustomAlert';
import { logActivity } from '../../utils/activityLogger';

// Empty data structure to replace mock client data
const initialClients = [];

// Load clients from localStorage or use initial empty array
const loadClientsFromLocalStorage = () => {
  const savedClients = localStorage.getItem('bossClients');
  return savedClients ? JSON.parse(savedClients) : initialClients;
};

export default function ClientManagement({ user, onLogout }) {
  const [clients, setClients] = useState(loadClientsFromLocalStorage());
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClient, setShowAddClient] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showViewClient, setShowViewClient] = useState(false)
  const [clientToView, setClientToView] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [clientToEdit, setClientToEdit] = useState(null)
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gst: '',
    status: 'Active'
  })

  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddClient = (e) => {
    e.preventDefault()
    // Create new client with unique ID
    const clientToAdd = {
      ...newClient,
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      projects: 0,
      status: newClient.status || 'Active'
    };

    // Add to clients state and save to localStorage
    const updatedClients = [...clients, clientToAdd];
    setClients(updatedClients);
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));

    // Log activity
    logActivity(user, 'create', 'client', clientToAdd.name, {
      clientId: clientToAdd.id,
      company: clientToAdd.company
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Client added successfully!', 'success')
    }

    // Reset form and close modal
    setNewClient({
      name: '',
      company: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gst: '',
      status: 'Active'
    })
    setShowAddClient(false)
  }

  const handleEditClient = (client) => {
    setClientToEdit(client);
    setNewClient({
      name: client.name,
      company: client.company,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      address: client.address,
      gst: client.gst,
      status: client.status
    });
    setShowEditClient(true);
  };

  const handleUpdateClient = (e) => {
    e.preventDefault();

    // Update client in state
    const updatedClients = clients.map(client =>
      client.id === clientToEdit.id
        ? { ...client, ...newClient }
        : client
    );

    setClients(updatedClients);
    
    // Save to localStorage
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));

    // Log activity
    const updatedClient = updatedClients.find(c => c.id === clientToEdit.id);
    if (updatedClient) {
      logActivity(user, 'update', 'client', updatedClient.name, {
        clientId: updatedClient.id,
        company: updatedClient.company
      });
    }
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Client updated successfully!', 'success')
    }

    // Reset form and close modal
    setNewClient({
      name: '',
      company: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      gst: '',
      status: 'Active'
    });
    setClientToEdit(null);
    setShowEditClient(false);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client)
    setShowDeleteAlert(true)
  }

  const handleViewClient = (client) => {
    setClientToView(client)
    setShowViewClient(true)
  }

  const confirmDeleteClient = () => {
    // Remove client from state and save to localStorage
    const updatedClients = clients.filter(client => client.id !== clientToDelete.id);
    setClients(updatedClients);
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));

    // Log activity
    logActivity(user, 'delete', 'client', clientToDelete.name, {
      clientId: clientToDelete.id,
      company: clientToDelete.company
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast(`Client "${clientToDelete.name}" deleted successfully!`, 'success')
    }
    setShowDeleteAlert(false)
    setClientToDelete(null)
  }

  return (
    <div className="p-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Manage Clients</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="form-input pl-14 pr-4"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="btn btn-primary flex items-center"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Clients Table */}
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
                <th className="w-1/6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id}>
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
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="btn-icon bg-blue-100 text-blue-600 hover:bg-blue-200"
                          onClick={() => handleViewClient(client)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon bg-gray-100 text-gray-600 hover:bg-gray-200"
                          onClick={() => handleEditClient(client)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon bg-red-100 text-red-600 hover:bg-red-200"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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

      {/* Delete Confirmation Alert */}
      <CustomAlert
        isOpen={showDeleteAlert}
        onClose={() => {
          setShowDeleteAlert(false)
          setClientToDelete(null)
        }}
        title="Delete Client"
        message={`Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone.`}
        type="warning"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteClient}
        showCancel={true}
      />

      {/* Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Add New Client
                </h3>
                <button
                  onClick={() => setShowAddClient(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleAddClient} className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="form-input w-full"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      required
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="form-input w-full"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      required
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    className="form-input w-full"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                    required
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="form-input w-full"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      required
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-input w-full"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="form-input w-full"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label htmlFor="gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst"
                    className="form-input w-full"
                    value={newClient.gst}
                    onChange={(e) => setNewClient({ ...newClient, gst: e.target.value })}
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="form-select w-full"
                    value={newClient.status || 'Active'}
                    onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary px-5 py-2.5"
                  onClick={() => setShowAddClient(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-5 py-2.5 flex items-center"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Client
                </h3>
                <button
                  onClick={() => {
                    setShowEditClient(false);
                    setClientToEdit(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateClient} className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      className="form-input w-full"
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      required
                      placeholder="Enter client name"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company *
                    </label>
                    <input
                      type="text"
                      id="edit-company"
                      className="form-input w-full"
                      value={newClient.company}
                      onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                      required
                      placeholder="Enter company name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="edit-contactPerson"
                    className="form-input w-full"
                    value={newClient.contactPerson}
                    onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })}
                    required
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="edit-phone"
                      className="form-input w-full"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      required
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      className="form-input w-full"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="edit-address"
                    className="form-input w-full"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Enter full address"
                  />
                </div>

                <div>
                  <label htmlFor="edit-gst" className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="edit-gst"
                    className="form-input w-full"
                    value={newClient.gst}
                    onChange={(e) => setNewClient({ ...newClient, gst: e.target.value })}
                    placeholder="Enter GST number"
                  />
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    className="form-select w-full"
                    value={newClient.status || 'Active'}
                    onChange={(e) => setNewClient({ ...newClient, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary px-5 py-2.5"
                  onClick={() => {
                    setShowEditClient(false);
                    setClientToEdit(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-5 py-2.5 flex items-center"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4 6-6" />
                  </svg>
                  Update Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* View Client Modal */}
      {showViewClient && clientToView && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Client Details
                </h3>
                <button 
                  onClick={() => setShowViewClient(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Client Name</label>
                    <p className="text-gray-900 font-medium">{clientToView.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Company</label>
                    <p className="text-gray-900">{clientToView.company || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                    <p className="text-gray-900">{clientToView.contactPerson || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <p className="text-gray-900">{clientToView.phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{clientToView.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-gray-900">{clientToView.address || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">GST Number</label>
                    <p className="text-gray-900">{clientToView.gst || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`badge ${clientToView.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {clientToView.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="btn btn-secondary px-5 py-2.5"
                  onClick={() => setShowViewClient(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}