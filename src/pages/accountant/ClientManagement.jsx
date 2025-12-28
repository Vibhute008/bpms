import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/CustomAlert';
import { logActivity } from '../../utils/activityLogger';

// Empty data structure to replace mock client data
const initialClients = [];

// Factory options
const factoryOptions = ['Mahape', 'Taloja'];

// Format number with commas
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Load clients from localStorage or use initial empty array
const loadClientsFromLocalStorage = () => {
  const savedClients = localStorage.getItem('bossClients');
  let clients = savedClients ? JSON.parse(savedClients) : initialClients;
  
  // Ensure all clients have proper structure with initialized arrays
  clients = clients.map(client => ({
    ...client,
    projects: client.projects || [],
    production: client.production || [],
    invoices: client.invoices || []
  }));
  
  return clients;
};

export default function AccountantClientManagement({ user, onLogout }) {
  const [clients, setClients] = useState(loadClientsFromLocalStorage());
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [productionEntries, setProductionEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddClient, setShowAddClient] = useState(false)
  const [showEditClient, setShowEditClient] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showViewClient, setShowViewClient] = useState(false)
  const [clientToView, setClientToView] = useState(null)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [clientToEdit, setClientToEdit] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditingView, setIsEditingView] = useState(false)
  const [viewClientData, setViewClientData] = useState(null)
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
  
  // State variables for project CRUD within client view modal
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: '',
    subject: '',
    language: '',
    totalQuantity: '',
    startDate: '',
    endDate: '',
    factory: '',
    status: 'pending'
  })
  
  // State variables for production CRUD within client view modal
  const [showAddProduction, setShowAddProduction] = useState(false)
  const [newProduction, setNewProduction] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    notes: '',
    factory: '',
    supervisorName: '',
    photos: []
  });
  
  // State variables for invoice CRUD within client view modal
  const [newInvoice, setNewInvoice] = useState({ file: null });
  const [showEditProject, setShowEditProject] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  // State variables for production expansion functionality
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [productionToEdit, setProductionToEdit] = useState(null);
  const [productionToDelete, setProductionToDelete] = useState(null);
  
  // Load projects and invoices for client details
  useEffect(() => {
    const loadProjects = () => {
      const savedProjects = localStorage.getItem('bossProjects');
      return savedProjects ? JSON.parse(savedProjects) : [];
    };
    
    const loadInvoices = () => {
      const savedInvoices = localStorage.getItem('accountantInvoices');
      return savedInvoices ? JSON.parse(savedInvoices) : [];
    };
    
    const loadProductionEntries = () => {
      try {
        const mahapeEntries = localStorage.getItem('dailyEntries_Mahape');
        const talojaEntries = localStorage.getItem('dailyEntries_Taloja');
        
        const mahapeData = mahapeEntries ? JSON.parse(mahapeEntries) : [];
        const talojaData = talojaEntries ? JSON.parse(talojaEntries) : [];
        
        return [...mahapeData, ...talojaData];
      } catch (error) {
        console.error('Error loading production entries:', error);
        return [];
      }
    };
    
    setProjects(loadProjects());
    setInvoices(loadInvoices());
    setProductionEntries(loadProductionEntries());
  }, []);

  // Refresh clients when localStorage changes
  const refreshClients = () => {
    const savedClients = localStorage.getItem('bossClients');
    setClients(savedClients ? JSON.parse(savedClients) : []);
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bossClients') {
        refreshClients();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
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
      projects: [],
      production: [],
      invoices: [],
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
    
    // Update client in state and save to localStorage, preserving existing arrays
    const updatedClients = clients.map(client => 
      client.id === clientToEdit.id 
        ? { 
            ...client, 
            ...newClient,
            projects: client.projects || [],
            production: client.production || [],
            invoices: client.invoices || []
          }
        : client
    );
    
    setClients(updatedClients);
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
  
  const handleViewClientUpdate = (e) => {
    e.preventDefault();

    // Update client in state
    const updatedClients = clients.map(client =>
      client.id === clientToView.id
        ? { ...client, ...viewClientData }
        : client
    );

    setClients(updatedClients);
    
    // Save to localStorage
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));

    // Log activity
    const updatedClient = updatedClients.find(c => c.id === clientToView.id);
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

    // Update clientToView and set edit mode to false
    setClientToView({...viewClientData});
    setIsEditingView(false);
  };

  const handleDeleteClient = (client) => {
    setClientToDelete(client)
    setShowDeleteAlert(true)
  }

  const handleViewClient = (client) => {
    setClientToView(client)
    setViewClientData({...client})
    setShowViewClient(true)
    setIsEditingView(false)
  }
  
  // Function to get projects for a specific client
  const getProjectsForClient = (client) => {
    return projects.filter(project => project.client === client.name);
  };
  
  // Function to get invoices for client's projects
  const getInvoicesForClient = (client) => {
    const clientProjects = getProjectsForClient(client);
    const projectIds = clientProjects.map(project => project.id);
    return invoices.filter(invoice => projectIds.includes(invoice.projectId));
  };
  
  // Function to get production data for client's projects
  const getProductionDataForClient = (client) => {
    const clientProjects = getProjectsForClient(client);
    const projectIds = clientProjects.map(project => project.id);
    return productionEntries.filter(entry => projectIds.includes(parseInt(entry.projectId)));
  };
  
  // Function to calculate total production quantity for client
  const getTotalProductionForClient = (client) => {
    const productionData = getProductionDataForClient(client);
    return productionData.reduce((total, entry) => total + (parseInt(entry.quantity) || 0), 0);
  };

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

  // Functions for project CRUD within client view modal
  const handleAddProjectToClient = (e) => {
    e.preventDefault();
    
    // Get client information from either the selected client in the form or the client being viewed
    const selectedClientId = newProject.clientId || clientToView?.id;
    const selectedClient = clients.find(c => c.id === parseInt(selectedClientId));
    
    if (!selectedClient) {
      if (typeof window.addToast === 'function') {
        window.addToast('Please select a valid client', 'error');
      }
      return;
    }
    
    // Create new project with unique ID
    const projectToAdd = {
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.name,
      client: selectedClient.name,
      clientId: selectedClient.id,
      subject: newProject.subject,
      language: newProject.language,
      totalQuantity: parseInt(newProject.totalQuantity) || 0,
      produced: 0,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      factory: newProject.factory,
      status: newProject.status || 'pending'
    };
    
    // Add to projects state and save to localStorage
    const updatedProjects = [...projects, projectToAdd];
    setProjects(updatedProjects);
    localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
    
    // Log activity
    logActivity(user, 'created', 'project', projectToAdd.name, {
      clientId: selectedClient.id,
      clientName: selectedClient.name
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project added successfully!', 'success');
    }
    
    // Reset form and close modal
    setNewProject({
      name: '',
      clientId: '',
      subject: '',
      language: '',
      totalQuantity: '',
      startDate: '',
      endDate: '',
      factory: '',
      status: 'pending'
    });
    setShowAddProject(false);
  };

  // Functions for production CRUD within client view modal
  const handleAddProductionToClient = (e) => {
    e.preventDefault();
    
    // Get the client's projects to associate with
    const clientProjects = getProjectsForClient(clientToView);
    
    // If no projects exist for this client, show error
    if (clientProjects.length === 0) {
      if (typeof window.addToast === 'function') {
        window.addToast('No projects found for this client. Please create a project first.', 'error');
      }
      return;
    }
    
    // Use the selected project from the form
    const projectId = newProduction.projectId;
    
    // Validate that a project is selected
    if (!projectId) {
      if (typeof window.addToast === 'function') {
        window.addToast('Please select a project.', 'error');
      }
      return;
    }
    
    // Create new production entry with unique ID
    const productionToAdd = {
      id: Date.now(), // Using timestamp as ID for production entries
      projectId: projectId,
      date: newProduction.date,
      quantity: parseInt(newProduction.quantity) || 0,
      notes: newProduction.notes,
      factory: newProduction.factory,
      supervisorName: newProduction.supervisorName,
      photos: newProduction.photos || []
    };
    
    // Load existing production entries for the factory
    const factoryEntriesKey = `dailyEntries_${newProduction.factory}`;
    const existingEntries = JSON.parse(localStorage.getItem(factoryEntriesKey) || '[]');
    
    // Add to production entries
    const updatedEntries = [...existingEntries, productionToAdd];
    localStorage.setItem(factoryEntriesKey, JSON.stringify(updatedEntries));
    
    // Update state
    if (newProduction.factory === 'Mahape') {
      const mahapeEntries = JSON.parse(localStorage.getItem('dailyEntries_Mahape') || '[]');
      const talojaEntries = JSON.parse(localStorage.getItem('dailyEntries_Taloja') || '[]');
      setProductionEntries([...mahapeEntries, ...talojaEntries]);
    } else if (newProduction.factory === 'Taloja') {
      const mahapeEntries = JSON.parse(localStorage.getItem('dailyEntries_Mahape') || '[]');
      const talojaEntries = JSON.parse(localStorage.getItem('dailyEntries_Taloja') || '[]');
      setProductionEntries([...mahapeEntries, ...talojaEntries]);
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('productionEntryAdded'));
    
    // Update client with new production, ensuring production array exists
    const updatedClient = {
      ...clientToView,
      production: [
        ...(clientToView.production || []),
        productionToAdd
      ]
    };
    
    // Update clients array with updated client
    const updatedClients = clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    );
    
    // Save to localStorage
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));
    
    // Update state
    setClients(updatedClients);
    
    // Update clientToView state
    setClientToView(updatedClient);
    
    // Log activity
    logActivity(user, 'created', 'production entry', `Production for project ${projectId}`, {
      clientId: clientToView.id,
      clientName: clientToView.name,
      quantity: productionToAdd.quantity
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Production entry added successfully!', 'success');
    }
    
    // Reset form and close modal
    setNewProduction({
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      notes: '',
      factory: '',
      supervisorName: '',
      photos: []
    });
    setShowAddProduction(false);
  };
  
  // Function to handle update production entry
  const handleUpdateProductionToClient = (e) => {
    e.preventDefault();
    
    // Find the factory for the existing entry
    const existingEntry = productionEntries.find(entry => entry.id === productionToEdit.id);
    const oldFactory = existingEntry?.factory || productionToEdit.factory;
    
    // Update the production entry
    const updatedProductionEntry = {
      ...newProduction,
      id: productionToEdit.id,
      projectId: newProduction.projectId,
      date: newProduction.date,
      quantity: parseInt(newProduction.quantity) || 0,
      notes: newProduction.notes,
      factory: newProduction.factory,
      supervisorName: newProduction.supervisorName,
      photos: newProduction.photos || []
    };
    
    // Load existing production entries for the old factory
    const oldFactoryEntriesKey = `dailyEntries_${oldFactory}`;
    let oldFactoryEntries = JSON.parse(localStorage.getItem(oldFactoryEntriesKey) || '[]');
    
    // Remove the old entry from the old factory
    oldFactoryEntries = oldFactoryEntries.filter(entry => entry.id !== productionToEdit.id);
    
    // Save updated entries to the old factory
    localStorage.setItem(oldFactoryEntriesKey, JSON.stringify(oldFactoryEntries));
    
    // Load existing production entries for the new factory
    const newFactoryEntriesKey = `dailyEntries_${newProduction.factory}`;
    let newFactoryEntries = JSON.parse(localStorage.getItem(newFactoryEntriesKey) || '[]');
    
    // Add the updated entry to the new factory
    newFactoryEntries = [...newFactoryEntries, updatedProductionEntry];
    localStorage.setItem(newFactoryEntriesKey, JSON.stringify(newFactoryEntries));
    
    // Update state
    const mahapeEntries = JSON.parse(localStorage.getItem('dailyEntries_Mahape') || '[]');
    const talojaEntries = JSON.parse(localStorage.getItem('dailyEntries_Taloja') || '[]');
    setProductionEntries([...mahapeEntries, ...talojaEntries]);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('productionEntryUpdated'));
    
    // Update client with updated production
    const updatedClient = {
      ...clientToView,
      production: [
        ...(clientToView.production || []).map(entry => 
          entry.id === productionToEdit.id ? updatedProductionEntry : entry
        )
      ]
    };
    
    // Update clients array with updated client
    const updatedClients = clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    );
    
    // Save to localStorage
    localStorage.setItem('bossClients', JSON.stringify(updatedClients));
    
    // Update state
    setClients(updatedClients);
    
    // Update clientToView state
    setClientToView(updatedClient);
    
    // Log activity
    logActivity(user, 'updated', 'production entry', `Production for project ${newProduction.projectId}`, {
      clientId: clientToView.id,
      clientName: clientToView.name,
      quantity: updatedProductionEntry.quantity
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Production entry updated successfully!', 'success');
    }
    
    // Reset form and close modal
    setProductionToEdit(null);
    setNewProduction({
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      notes: '',
      factory: '',
      supervisorName: '',
      photos: []
    });
    setShowAddProduction(false);
  };
  
  // Functions for invoice CRUD within client view modal
  
  // Function to toggle entry expansion
  const toggleEntryExpansion = (entryId) => {
    setExpandedEntry(prev => prev === entryId ? null : entryId);
  };
  
  // Function to handle edit entry
  const handleEditEntry = (entry) => {
    setNewProduction({
      ...entry,
      date: entry.date || new Date().toISOString().split('T')[0]
    });
    setProductionToEdit(entry);
    setShowAddProduction(true);
  };
  
  // Function to handle delete entry
  const handleDeleteEntry = (entry) => {
    setProductionToDelete(entry);
    setShowDeleteAlert(true);
  };
  
  // Function to handle photo upload
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (newProduction.photos.length + files.length > 10) {
      if (typeof window.addToast === 'function') {
        window.addToast('Maximum of 10 photos allowed', 'error');
      }
      return;
    }
    
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      url: URL.createObjectURL(file),
      file: file
    }));
    
    setNewProduction(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };
  
  // Function to remove a photo
  const removePhoto = (index) => {
    setNewProduction(prev => {
      const newPhotos = [...prev.photos];
      // Revoke object URL to free memory
      URL.revokeObjectURL(newPhotos[index].url);
      newPhotos.splice(index, 1);
      return {
        ...prev,
        photos: newPhotos
      };
    });
  };
  
  // Function to handle view project production
  const handleViewProjectProduction = (project) => {
    // Navigate to the production view page for the specific project
    if (typeof window.addToast === 'function') {
      window.addToast(`Viewing production details for project: ${project.name}`, 'info');
    }
  };
  
  // Function to handle edit project
  const handleEditProject = (project) => {
    setNewProject({
      ...project,
      clientId: project.clientId || clientToView.id
    });
    setProjectToEdit(project);
    setShowEditProject(true);
  };
  
  // Function to handle delete project
  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteAlert(true);
  };
  
  // Function to handle file upload
  const handleFileUpload = (projectId) => {
    setSelectedProject(projectId);
    setShowUploadModal(true);
  };
  
  return (
    <div>
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
        {/* Table view for larger screens */}
        <div className="overflow-x-auto hidden md:block">
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
        
        {/* Card view for mobile */}
        <div className="block md:hidden">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div key={client.id} className="border-b border-gray-200 py-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{client.name}</div>
                    <div className="text-gray-500 text-sm mt-1">{client.email}</div>
                    <div className="mt-2 space-y-1">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Company:</span> {client.company}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Contact:</span> {client.contactPerson}
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Phone:</span> {client.phone}
                      </div>
                      <div className="mt-2">
                        <span className={`badge ${client.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col space-y-2">
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
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No clients found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
              </div>
            </div>
          )}
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
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, contactPerson: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, gst: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, status: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, contactPerson: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
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
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, gst: e.target.value})}
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
                    onChange={(e) => setNewClient({...newClient, status: e.target.value})}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out scale-100">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{clientToView.name}</h3>
                    <p className="text-sm text-gray-600">{clientToView.company || 'No company'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditingView ? (
                    <button
                      onClick={() => {
                        setViewClientData({...clientToView});
                        setIsEditingView(false);
                      }}
                      className="btn btn-secondary px-3 py-1.5 text-sm flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingView(true)}
                      className="btn btn-primary px-3 py-1.5 text-sm flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  <button 
                    onClick={() => setShowViewClient(false)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Overview
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'projects'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Projects
                        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {getProjectsForClient(clientToView).length}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('production')}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'production'
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Production
                        <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {getProductionDataForClient(clientToView).length}
                        </span>
                      </div>
                    </button>

                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
                  {activeTab === 'overview' && (
                    <div>
                      {isEditingView ? (
                        <form onSubmit={handleViewClientUpdate}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h4>
                              <div className="space-y-3">
                                <div>
                                  <label htmlFor="view-contactPerson" className="block text-xs text-gray-500 mb-1">Contact Person *</label>
                                  <input
                                    type="text"
                                    id="view-contactPerson"
                                    className="form-input w-full"
                                    value={viewClientData.contactPerson || ''}
                                    onChange={(e) => setViewClientData({...viewClientData, contactPerson: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <label htmlFor="view-phone" className="block text-xs text-gray-500 mb-1">Phone *</label>
                                  <input
                                    type="tel"
                                    id="view-phone"
                                    className="form-input w-full"
                                    value={viewClientData.phone || ''}
                                    onChange={(e) => setViewClientData({...viewClientData, phone: e.target.value})}
                                    required
                                  />
                                </div>
                                <div>
                                  <label htmlFor="view-email" className="block text-xs text-gray-500 mb-1">Email *</label>
                                  <input
                                    type="email"
                                    id="view-email"
                                    className="form-input w-full"
                                    value={viewClientData.email || ''}
                                    onChange={(e) => setViewClientData({...viewClientData, email: e.target.value})}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Additional Details</h4>
                              <div className="space-y-3">
                                <div>
                                  <label htmlFor="view-address" className="block text-xs text-gray-500 mb-1">Address</label>
                                  <input
                                    type="text"
                                    id="view-address"
                                    className="form-input w-full"
                                    value={viewClientData.address || ''}
                                    onChange={(e) => setViewClientData({...viewClientData, address: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label htmlFor="view-gst" className="block text-xs text-gray-500 mb-1">GST Number</label>
                                  <input
                                    type="text"
                                    id="view-gst"
                                    className="form-input w-full"
                                    value={viewClientData.gst || ''}
                                    onChange={(e) => setViewClientData({...viewClientData, gst: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <label htmlFor="view-status" className="block text-xs text-gray-500 mb-1">Status</label>
                                  <select
                                    id="view-status"
                                    className="form-select w-full"
                                    value={viewClientData.status || 'Active'}
                                    onChange={(e) => setViewClientData({...viewClientData, status: e.target.value})}
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                              <p className="text-sm font-semibold text-blue-800">Total Projects</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">{getProjectsForClient(clientToView).length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                              <p className="text-sm font-semibold text-green-800">Total Production</p>
                              <p className="text-2xl font-bold text-green-900 mt-1">{getTotalProductionForClient(clientToView).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              type="button"
                              onClick={() => {
                                setViewClientData({...clientToView});
                                setIsEditingView(false);
                              }}
                              className="btn btn-secondary px-5 py-2.5"
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
                              Save Changes
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact Information</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500">Contact Person</p>
                                  <p className="text-gray-900 font-medium">{clientToView.contactPerson || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-gray-900 font-medium">{clientToView.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Email</p>
                                  <p className="text-gray-900 font-medium">{clientToView.email || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Additional Details</h4>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500">Address</p>
                                  <p className="text-gray-900 font-medium">{clientToView.address || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">GST Number</p>
                                  <p className="text-gray-900 font-medium">{clientToView.gst || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Status</p>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    clientToView.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {clientToView.status || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                              <p className="text-sm font-semibold text-blue-800">Total Projects</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">{getProjectsForClient(clientToView).length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                              <p className="text-sm font-semibold text-green-800">Total Production</p>
                              <p className="text-2xl font-bold text-green-900 mt-1">{getTotalProductionForClient(clientToView).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'projects' && (
                    <div>
                      <div className="mb-6 flex justify-between items-center">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                          <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Projects
                        </h4>
                        <button
                          onClick={() => setShowAddProject(true)}
                          className="btn btn-primary flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Project
                        </button>
                      </div>
                      
                      {getProjectsForClient(clientToView).length > 0 ? (
                        <div className="shadow ring-1 ring-black ring-opacity-5 rounded-lg overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">Project Name</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Client</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Subject/Language</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Progress</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Factory</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Dates</th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Status</th>
                                <th scope="col" className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {getProjectsForClient(clientToView).map((project) => {
                                const projectInvoices = invoices.filter(invoice => parseInt(invoice.projectId) === parseInt(project.id));
                                return (
                                <tr key={project.id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    <div className="font-medium text-gray-900 truncate" title={project.name}>{project.name}</div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                    {project.client || clientToView.name}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-gray-900">
                                    <div className="truncate" title={project.subject}>{project.subject}</div>
                                    <div className="text-gray-500 truncate" title={project.language}>{project.language}</div>
                                  </td>
                                  <td>
                                    <div className="flex items-center mb-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2 flex-1">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${project.totalQuantity > 0 ? Math.round((project.produced / project.totalQuantity) * 100) : 0}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm text-gray-600 whitespace-nowrap">
                                        {project.totalQuantity > 0 ? Math.round((project.produced / project.totalQuantity) * 100) : 0}%
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">
                                      {project.produced.toLocaleString()} / {project.totalQuantity.toLocaleString()}
                                    </div>
                                    {/* Show supervisor entry info */}
                                    <div className="text-xs text-gray-400 truncate">
                                      Based on real-time supervisor entries
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                      {project.factory}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="text-sm truncate" title={project.startDate}>{project.startDate}</div>
                                    <div className="text-sm text-gray-500 truncate" title={`to ${project.endDate}`}>to {project.endDate}</div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                      project.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                      {project.produced >= project.totalQuantity && project.status === 'completed' && (
                                        <span className="ml-1 text-xs">(Auto)</span>
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-1">
                                      <button 
                                        className="btn-icon bg-blue-100 text-blue-600 hover:bg-blue-200"
                                        onClick={() => handleViewProjectProduction(project)}
                                        title="View Production Details"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                      </button>
                                      <button 
                                        className="btn-icon bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        onClick={() => handleEditProject(project)}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button 
                                        className="btn-icon bg-red-100 text-red-600 hover:bg-red-200"
                                        onClick={() => handleDeleteProject(project)}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                                        </svg>
                                      </button>
                                      <button 
                                        className="btn-icon bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={() => handleFileUpload(project.id)}
                                        title="Upload Invoice"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                      </button>
                                    </div>
                                    
                                    {/* Display uploaded invoices */}
                                    {projectInvoices.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center text-xs text-gray-500 mb-1">
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          Invoices
                                        </div>
                                        <div className="space-y-1 max-h-20 overflow-y-auto">
                                          {projectInvoices.slice(0, 3).map(invoice => (  // Show only first 3 invoices to prevent overflow
                                            <div key={invoice.id} className="flex items-center text-xs">
                                              <svg className="w-3 h-3 mr-1 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                              <span 
                                                className="text-blue-600 hover:underline cursor-pointer truncate max-w-[120px]"
                                                onClick={() => handleFileOpen(invoice.fileName)}
                                                title={invoice.fileName}
                                              >
                                                {invoice.fileName}
                                              </span>
                                              <span className="ml-1 text-gray-400 text-xs truncate">({invoice.uploadedBy})</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                                )})}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                          <p className="mt-1 text-sm text-gray-500">No projects have been assigned to this client yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'production' && (
                    <div>
                      <div className="mb-6 flex justify-between items-center">
                        <h4 className="text-lg font-bold text-gray-900 flex items-center">
                          <svg className="h-5 w-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Production Data
                        </h4>
                        <button
                          onClick={() => setShowAddProduction(true)}
                          className="btn btn-primary flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Production
                        </button>
                      </div>
                      
                      {getProductionDataForClient(clientToView).length > 0 ? (
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                              <p className="text-sm font-semibold text-blue-800">Total Production</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">{getTotalProductionForClient(clientToView).toLocaleString()}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                              <p className="text-sm font-semibold text-green-800">Projects Count</p>
                              <p className="text-2xl font-bold text-green-900 mt-1">{getProjectsForClient(clientToView).length}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                              <p className="text-sm font-semibold text-purple-800">Avg. Production</p>
                              <p className="text-2xl font-bold text-purple-900 mt-1">{getProductionDataForClient(clientToView).length > 0 
                                ? Math.round(getTotalProductionForClient(clientToView) / getProductionDataForClient(clientToView).length) 
                                : 0}</p>
                            </div>
                          </div>
                          
                          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">Date</th>
                                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Project</th>
                                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Quantity</th>
                                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Photos</th>
                                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {getProductionDataForClient(clientToView)
                                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                                  .map((entry, index) => {
                                    const project = projects.find(p => parseInt(p.id) === parseInt(entry.projectId));
                                    return (
                                      <tr key={entry.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">{entry.date}</td>
                                        <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900">{project ? project.name : 'Unknown Project'}</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{formatNumber(entry.quantity)}</td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{entry.photos ? entry.photos.length : 0} photos</td>
                                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-right">
                                          <div className="flex flex-col space-y-1">
                                            <button 
                                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 transition-all duration-200"
                                              onClick={() => toggleEntryExpansion(entry.id)}
                                            >
                                              {expandedEntry === entry.id ? 'Hide' : 'View'}
                                            </button>
                                            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || (user.role === 'OPERATOR' && entry.projectId && projects.find(p => p.id === entry.projectId)?.factory === user.factory)) && (
                                              <>
                                                <button 
                                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-all duration-200"
                                                  onClick={() => handleEditEntry(entry)}
                                                >
                                                  Edit
                                                </button>
                                                <button 
                                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-all duration-200"
                                                  onClick={() => handleDeleteEntry(entry)}
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No production data</h3>
                          <p className="mt-1 text-sm text-gray-500">No production entries have been recorded for this client.</p>
                        </div>
                      )}
                    </div>
                  )}
                  

                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-end">
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
      
      {/* Add Project Modal within Client View */}
      {showAddProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add Project for {clientToView?.name}</h3>
            </div>
            <form onSubmit={handleAddProjectToClient}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select
                    className="form-select"
                    value={newProject.clientId || clientToView?.id}
                    onChange={(e) => setNewProject({...newProject, clientId: e.target.value})}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newProject.subject}
                      onChange={(e) => setNewProject({...newProject, subject: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newProject.language}
                      onChange={(e) => setNewProject({...newProject, language: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProject.totalQuantity}
                    onChange={(e) => setNewProject({...newProject, totalQuantity: e.target.value})}
                    min="0"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factory</label>
                  <select
                    className="form-select"
                    value={newProject.factory}
                    onChange={(e) => setNewProject({...newProject, factory: e.target.value})}
                    required
                  >
                    <option value="">Select a factory</option>
                    {factoryOptions.map(factory => (
                      <option key={factory} value={factory}>{factory}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="form-select"
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProject(false);
                    setNewProject({
                      name: '',
                      clientId: '',
                      subject: '',
                      language: '',
                      totalQuantity: '',
                      startDate: '',
                      endDate: '',
                      factory: '',
                      status: 'pending'
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal within Client View */}
      {showEditProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Project for {clientToView?.name}</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Update the project with the edited values
              const updatedProjects = projects.map(p => 
                p.id === projectToEdit.id ? { ...p, ...newProject, id: projectToEdit.id } : p
              );
              setProjects(updatedProjects);
              // Save to localStorage
              localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
              // Show success message
              if (typeof window.addToast === 'function') {
                window.addToast('Project updated successfully!', 'success');
              }
              // Reset and close modal
              setShowEditProject(false);
              setProjectToEdit(null);
            }}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProject.subject}
                    onChange={(e) => setNewProject({...newProject, subject: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newProject.language}
                    onChange={(e) => setNewProject({...newProject, language: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newProject.totalQuantity}
                    onChange={(e) => setNewProject({...newProject, totalQuantity: e.target.value})}
                    min="0"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factory</label>
                  <select
                    className="form-select"
                    value={newProject.factory}
                    onChange={(e) => setNewProject({...newProject, factory: e.target.value})}
                    required
                  >
                    <option value="">Select a factory</option>
                    {factoryOptions.map(factory => (
                      <option key={factory} value={factory}>{factory}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="form-select"
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProject(false);
                    setProjectToEdit(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add/Edit Production Modal within Client View */}
      {showAddProduction && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">{productionToEdit ? 'Edit Production Entry' : 'Add Production Entry'}</h3>
                <button 
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  onClick={() => {
                    setShowAddProduction(false);
                    setProductionToEdit(null);
                    setNewProduction({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      factory: '',
                      supervisorName: ''
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">{productionToEdit ? 'Update production data with photos and notes' : 'Record production data with photos and notes'}</p>
            </div>
            
            <form onSubmit={productionToEdit ? handleUpdateProductionToClient : handleAddProductionToClient} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project *
                </label>
                <select
                  value={newProduction.projectId}
                  onChange={(e) => setNewProduction({...newProduction, projectId: e.target.value})}
                  className="form-select w-full"
                  required
                >
                  <option value="">Choose a project</option>
                  {getProjectsForClient(clientToView).map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.subject})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newProduction.date}
                  onChange={(e) => setNewProduction({...newProduction, date: e.target.value})}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Produced *
                </label>
                <input
                  type="number"
                  value={newProduction.quantity}
                  onChange={(e) => setNewProduction({...newProduction, quantity: e.target.value})}
                  className="form-input w-full"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Enter the exact number of units produced</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Factory
                </label>
                <select
                  className="form-select w-full"
                  value={newProduction.factory}
                  onChange={(e) => setNewProduction({...newProduction, factory: e.target.value})}
                  required
                >
                  <option value="">Select a factory</option>
                  {factoryOptions.map(factory => (
                    <option key={factory} value={factory}>{factory}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newProduction.notes || ''}
                  onChange={(e) => setNewProduction({...newProduction, notes: e.target.value})}
                  className="form-textarea w-full"
                  rows="3"
                  placeholder="Add any additional notes about this production entry..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  className="form-input w-full"
                  value={newProduction.supervisorName}
                  onChange={(e) => setNewProduction({...newProduction, supervisorName: e.target.value})}
                  placeholder="Enter supervisor name"
                />
              </div>
              
              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Photos
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200 cursor-pointer"
                  onClick={() => document.getElementById('photo-upload-accountant')?.click()}
                >
                  <input 
                    id="photo-upload-accountant"
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                  />
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB each)</p>
                  {newProduction.photos && newProduction.photos.length > 0 && (
                    <p className="mt-1 text-sm text-green-600">{newProduction.photos.length} photo(s) selected</p>
                  )}
                </div>
                
                {/* Photo Previews */}
                {newProduction.photos && newProduction.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                    {newProduction.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={photo.url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-20 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(index);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProduction(false);
                    setNewProduction({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      factory: '',
                      supervisorName: ''
                    });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {productionToEdit ? 'Update Production Entry' : 'Add Production Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Alert */}
      {showDeleteAlert && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                {projectToDelete ? 
                  `Are you sure you want to delete the project "${projectToDelete?.name}"?` :
                  productionToDelete ?
                  `Are you sure you want to delete the production entry for ${productionToDelete?.date}?` :
                  'Are you sure you want to delete this item?'}
                This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAlert(false);
                  setProjectToDelete(null);
                  setProductionToDelete(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (projectToDelete) {
                    // Remove the project from state
                    const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
                    setProjects(updatedProjects);
                    // Remove related production entries
                    const updatedProductionEntries = productionEntries.filter(entry => entry.projectId !== projectToDelete.id);
                    setProductionEntries(updatedProductionEntries);
                    // Remove related invoices
                    const updatedInvoices = invoices.filter(invoice => parseInt(invoice.projectId) !== parseInt(projectToDelete.id));
                    setInvoices(updatedInvoices);
                    // Save to localStorage
                    localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
                    localStorage.setItem('dailyEntries_Mahape', JSON.stringify(updatedProductionEntries.filter(entry => entry.factory === 'Mahape')));
                    localStorage.setItem('dailyEntries_Taloja', JSON.stringify(updatedProductionEntries.filter(entry => entry.factory === 'Taloja')));
                    localStorage.setItem('accountantInvoices', JSON.stringify(updatedInvoices));
                    // Show success message
                    if (typeof window.addToast === 'function') {
                      window.addToast('Project deleted successfully!', 'success');
                    }
                  } else if (productionToDelete) {
                    // Remove the production entry from state
                    const oldFactory = productionToDelete.factory;
                    const oldFactoryEntriesKey = `dailyEntries_${oldFactory}`;
                    let oldFactoryEntries = JSON.parse(localStorage.getItem(oldFactoryEntriesKey) || '[]');
                    
                    // Remove the entry from the factory
                    oldFactoryEntries = oldFactoryEntries.filter(entry => entry.id !== productionToDelete.id);
                    localStorage.setItem(oldFactoryEntriesKey, JSON.stringify(oldFactoryEntries));
                    
                    // Update state
                    const mahapeEntries = JSON.parse(localStorage.getItem('dailyEntries_Mahape') || '[]');
                    const talojaEntries = JSON.parse(localStorage.getItem('dailyEntries_Taloja') || '[]');
                    setProductionEntries([...mahapeEntries, ...talojaEntries]);
                    
                    // Update client with production removed
                    const updatedClient = {
                      ...clientToView,
                      production: [
                        ...(clientToView.production || []).filter(entry => entry.id !== productionToDelete.id)
                      ]
                    };
                    
                    // Update clients array with updated client
                    const updatedClients = clients.map(client => 
                      client.id === updatedClient.id ? updatedClient : client
                    );
                    
                    // Save to localStorage
                    localStorage.setItem('bossClients', JSON.stringify(updatedClients));
                    
                    // Update state
                    setClients(updatedClients);
                    
                    // Update clientToView state
                    setClientToView(updatedClient);
                    
                    // Log activity
                    logActivity(user, 'deleted', 'production entry', `Production for project ${productionToDelete.projectId}`, {
                      clientId: clientToView.id,
                      clientName: clientToView.name,
                      quantity: productionToDelete.quantity
                    });
                    
                    // Show success message
                    if (typeof window.addToast === 'function') {
                      window.addToast('Production entry deleted successfully!', 'success');
                    }
                  }
                  // Reset and close alert
                  setShowDeleteAlert(false);
                  setProjectToDelete(null);
                  setProductionToDelete(null);
                }}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Invoice Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Invoice for Project</h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Create new invoice entry
              const invoiceToAdd = {
                id: Date.now(),
                projectId: selectedProject,
                fileName: newInvoice.file.name,
                uploadDate: new Date().toISOString().split('T')[0],
                uploadedBy: user.role === 'SUPER_ADMIN' ? 'Boss' : 'Accountant'
              };
              
              // Add to invoices state and save to localStorage
              const updatedInvoices = [...invoices, invoiceToAdd];
              setInvoices(updatedInvoices);
              localStorage.setItem('accountantInvoices', JSON.stringify(updatedInvoices));
              
              // Show success message
              if (typeof window.addToast === 'function') {
                window.addToast('Invoice uploaded successfully!', 'success');
              }
              
              // Reset form and close modal
              setNewInvoice({ file: null });
              setShowUploadModal(false);
              setSelectedProject(null);
            }}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice File</label>
                  <input
                    type="file"
                    className="form-input w-full"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setNewInvoice({...newInvoice, file: e.target.files[0]})}
                    required
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedProject(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Upload Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

    </div>
  )
}