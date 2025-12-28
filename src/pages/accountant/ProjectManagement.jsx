import { useState, useEffect } from 'react';
import { logActivity } from '../../utils/activityLogger';

// Empty data structure to replace mock project data
const initialProjects = [];

// Load clients from localStorage or use empty array
const loadClientsFromLocalStorage = () => {
  const savedClients = localStorage.getItem('bossClients');
  return savedClients ? JSON.parse(savedClients) : [];
};

const mockClients = loadClientsFromLocalStorage();

// Empty data structure to replace mock data
const mockInvoices = [];

// Load projects from localStorage or use initial empty array
const loadProjectsFromLocalStorage = () => {
  const savedProjects = localStorage.getItem('bossProjects');
  return savedProjects ? JSON.parse(savedProjects) : initialProjects;
};

// Load invoices from localStorage or use initial empty array
const loadInvoicesFromLocalStorage = () => {
  const savedInvoices = localStorage.getItem('accountantInvoices');
  return savedInvoices ? JSON.parse(savedInvoices) : mockInvoices;
};

export default function ProjectManagement({ user, onLogout }) {
  const [projects, setProjects] = useState(loadProjectsFromLocalStorage());
  const [clients, setClients] = useState(loadClientsFromLocalStorage());
  const [invoices, setInvoices] = useState(loadInvoicesFromLocalStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ file: null });
  // Add project management states
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    clientId: '',
    client: '',
    subject: '',
    language: '',
    factory: 'Mahape', // Default value
    startDate: '',
    endDate: '',
    totalQuantity: '',
    status: 'ongoing'
  });

  // Refresh projects when localStorage changes
  const refreshProjects = () => {
    const savedProjects = localStorage.getItem('bossProjects');
    setProjects(savedProjects ? JSON.parse(savedProjects) : []);
  };

  // Refresh clients when localStorage changes
  const refreshClients = () => {
    const savedClients = localStorage.getItem('bossClients');
    setClients(savedClients ? JSON.parse(savedClients) : []);
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bossProjects') {
        refreshProjects();
      } else if (e.key === 'bossClients') {
        refreshClients();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (projectId) => {
    setSelectedProject(projectId);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    
    if (!newInvoice.file) {
      if (typeof window.addToast === 'function') {
        window.addToast('Please select a file to upload', 'error');
      }
      return;
    }

    // Create new invoice entry
    const invoiceToAdd = {
      id: invoices.length > 0 ? Math.max(...invoices.map(i => i.id)) + 1 : 1,
      projectId: selectedProject,
      fileName: newInvoice.file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: user.role === 'ADMIN' ? 'Accountant' : 'Boss'
    };

    // Add to invoices state and save to localStorage
    const updatedInvoices = [...invoices, invoiceToAdd];
    setInvoices(updatedInvoices);
    localStorage.setItem('accountantInvoices', JSON.stringify(updatedInvoices));

    // Log activity
    const projectForLogging = projects.find(p => p.id === invoiceToAdd.projectId);
    logActivity(user, 'create', 'invoice', invoiceToAdd.fileName, {
      projectId: invoiceToAdd.projectId,
      projectName: projectForLogging ? projectForLogging.name : 'Unknown Project'
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Invoice uploaded successfully!', 'success');
    }

    // Reset form and close modal
    setNewInvoice({ file: null });
    setShowUploadModal(false);
    setSelectedProject(null);
  };

  const handleFileOpen = (fileName) => {
    // In a real application, this would open the actual Excel file from the server
    // For demo purposes, we'll create a downloadable CSV file that can be opened in Excel
    
    // Create a sample CSV content (in real app, this would come from the server)
    const csvContent = `Project Invoice Data
File,${fileName}
Uploaded on,${new Date().toLocaleDateString()}
Uploaded by,${user.role === 'ADMIN' ? 'Accountant' : 'Boss'}

Sample Invoice Data:
Client,-
Project,-
Invoice Date,${new Date().toLocaleDateString()}
Amount,₹0

Description,Quantity,Unit Price,Total
No data,-,-,-
Grand Total,,,"₹0"`;

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName.replace(/\.[^/.]+$/, "") + '.csv' || 'invoice.csv');
    
    // Trigger the download
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof window.addToast === 'function') {
      window.addToast(`Downloading ${fileName}...`, 'info');
    }
  };

  const getProjectInvoices = (projectId) => {
    return invoices.filter(invoice => invoice.projectId === projectId);
  };

  // Add project functions
  const handleAddProject = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newProject.name || !newProject.clientId || !newProject.subject || !newProject.language || !newProject.startDate || !newProject.endDate) {
      if (typeof window.addToast === 'function') {
        window.addToast('Please fill in all required fields', 'error');
      }
      return;
    }

    // Get client name from ID
    const selectedClient = clients.find(c => c.id === parseInt(newProject.clientId));
    const clientName = selectedClient ? selectedClient.name : 'Unknown Client';

    // Create new project with unique ID
    const projectToAdd = {
      ...newProject,
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      client: clientName, // Use the client name from the selected client
      totalQuantity: parseInt(newProject.totalQuantity) || 0,
      status: newProject.status || 'ongoing'
    };
    
    // Add to projects state and save to localStorage
    const updatedProjects = [...projects, projectToAdd];
    setProjects(updatedProjects);
    localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
    
    // Log activity
    logActivity(user, 'create', 'project', projectToAdd.name, {
      projectId: projectToAdd.id,
      client: projectToAdd.client
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project added successfully!', 'success');
    }
    
    // Reset form and close modal
    setNewProject({
      name: '',
      clientId: '',
      client: '',
      subject: '',
      language: '',
      factory: 'Mahape',
      startDate: '',
      endDate: '',
      totalQuantity: '',
      status: 'ongoing'
    });
    setShowAddProject(false);
  };

  const handleEditProject = (project) => {
    setProjectToEdit(project);
    // Find client ID from client name
    const client = clients.find(c => c.name === project.client);
    setNewProject({
      name: project.name,
      clientId: client ? client.id.toString() : '',
      client: project.client,
      subject: project.subject,
      language: project.language,
      factory: project.factory || 'Mahape',
      startDate: project.startDate,
      endDate: project.endDate,
      totalQuantity: project.totalQuantity,
      status: project.status
    });
    setShowEditProject(true);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newProject.name || !newProject.clientId || !newProject.subject || !newProject.language || !newProject.startDate || !newProject.endDate) {
      if (typeof window.addToast === 'function') {
        window.addToast('Please fill in all required fields', 'error');
      }
      return;
    }
    
    // Get client name from ID
    const selectedClient = clients.find(c => c.id === parseInt(newProject.clientId));
    const clientName = selectedClient ? selectedClient.name : 'Unknown Client';
    
    // Update project in state and save to localStorage
    const updatedProjects = projects.map(project => 
      project.id === projectToEdit.id 
        ? { 
            ...project, 
            ...newProject, 
            client: clientName, // Use the client name from the selected client
            totalQuantity: parseInt(newProject.totalQuantity) || 0 
          }
        : project
    );
    
    setProjects(updatedProjects);
    localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
    
    // Log activity
    const updatedProject = updatedProjects.find(p => p.id === projectToEdit.id);
    if (updatedProject) {
      logActivity(user, 'update', 'project', updatedProject.name, {
        projectId: updatedProject.id,
        client: updatedProject.client
      });
    }
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project updated successfully!', 'success');
    }
    
    // Reset form and close modal
    setNewProject({
      name: '',
      clientId: '',
      client: '',
      subject: '',
      language: '',
      factory: 'Mahape',
      startDate: '',
      endDate: '',
      totalQuantity: '',
      status: 'ongoing'
    });
    setProjectToEdit(null);
    setShowEditProject(false);
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteAlert(true);
  };

  const confirmDeleteProject = () => {
    // Remove project from state and save to localStorage
    const updatedProjects = projects.filter(project => project.id !== projectToDelete.id);
    setProjects(updatedProjects);
    localStorage.setItem('bossProjects', JSON.stringify(updatedProjects));
    
    // Log activity
    logActivity(user, 'delete', 'project', projectToDelete.name, {
      projectId: projectToDelete.id,
      client: projectToDelete.client
    });
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast(`Project "${projectToDelete.name}" deleted successfully!`, 'success');
    }
    setShowDeleteAlert(false);
    setProjectToDelete(null);
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Project Management</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="form-input pl-10 pr-4"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddProject(true)}
            className="btn btn-primary flex items-center"
          >
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        {/* Table view for larger screens */}
        <div className="overflow-x-auto hidden md:block">
          <table className="table">
            <thead>
              <tr>
                <th className="w-3/12">Project Name</th>
                <th className="w-2/12">Client</th>
                <th className="w-2/12">Subject/Language</th>
                <th className="w-1/12">Factory</th>
                <th className="w-1/12">Dates</th>
                <th className="w-1/12">Status</th>
                <th className="w-2/12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const projectInvoices = getProjectInvoices(project.id);
                  return (
                    <tr key={project.id}>
                      <td>
                        <div className="font-medium text-gray-900">{project.name}</div>
                      </td>
                      <td>{project.client}</td>
                      <td>
                        <div>{project.subject}</div>
                        <div className="text-gray-500 text-sm">{project.language}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{project.factory}</span>
                      </td>
                      <td>
                        <div className="text-sm">{project.startDate}</div>
                        <div className="text-sm text-gray-500">to {project.endDate}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          project.status === 'completed' ? 'badge-success' : 
                          project.status === 'ongoing' ? 'badge-warning' : 'badge-secondary'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleFileUpload(project.id)}
                          >
                            Upload Invoice
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
                        </div>
                        
                        {/* Display uploaded invoices - only for bosses and accountants */}
                        {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && projectInvoices.length > 0 && (
                          <div className="mt-2 text-left">
                            <div className="text-xs text-gray-500">Uploaded Invoices:</div>
                            {projectInvoices.map(invoice => (
                              <div key={invoice.id} className="flex items-center text-xs mt-1">
                                <span 
                                  className="text-blue-600 hover:underline cursor-pointer truncate max-w-[120px]"
                                  onClick={() => handleFileOpen(invoice.fileName)}
                                  title={invoice.fileName}
                                >
                                  {invoice.fileName}
                                </span>
                                <span className="ml-1 text-gray-400">({invoice.uploadedBy})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
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
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const projectInvoices = getProjectInvoices(project.id);
              return (
                <div key={project.id} className="border-b border-gray-200 py-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 mb-1">{project.name}</div>
                      <div className="text-sm text-gray-900 mb-1">{project.client}</div>
                      <div className="text-sm text-gray-700 mb-1">
                        <div>{project.subject}</div>
                        <div className="text-gray-500">{project.language}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="badge badge-info">{project.factory}</span>
                        <div className="text-xs text-gray-700">
                          <div>{project.startDate}</div>
                          <div className="text-gray-500">to {project.endDate}</div>
                        </div>
                        <span className={`badge ${
                          project.status === 'completed' ? 'badge-success' : 
                          project.status === 'ongoing' ? 'badge-warning' : 'badge-secondary'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Display uploaded invoices - only for bosses and accountants */}
                      {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && projectInvoices.length > 0 && (
                        <div className="mt-2 text-left">
                          <div className="text-xs text-gray-500">Uploaded Invoices:</div>
                          {projectInvoices.map(invoice => (
                            <div key={invoice.id} className="flex items-center text-xs mt-1">
                              <span 
                                className="text-blue-600 hover:underline cursor-pointer truncate max-w-[120px]"
                                onClick={() => handleFileOpen(invoice.fileName)}
                                title={invoice.fileName}
                              >
                                {invoice.fileName}
                              </span>
                              <span className="ml-1 text-gray-400">({invoice.uploadedBy})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleFileUpload(project.id)}
                      >
                        Upload Invoice
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
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
                <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Invoice Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Invoice</h3>
            </div>
            <form onSubmit={handleUploadSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="invoiceFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Excel File
                  </label>
                  <input
                    type="file"
                    id="invoiceFile"
                    className="form-input w-full"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setNewInvoice({...newInvoice, file: e.target.files[0]})}
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Supported formats: .xlsx, .xls, .csv</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedProject(null);
                    setNewInvoice({ file: null });
                  }}
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
      
      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Project</h3>
            </div>
            <form onSubmit={handleAddProject} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    className="form-input w-full"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="client"
                    className="form-select w-full"
                    value={newProject.clientId}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.id === parseInt(e.target.value));
                      setNewProject({
                        ...newProject,
                        clientId: e.target.value,
                        client: selectedClient ? selectedClient.name : ''
                      });
                    }}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="form-input w-full"
                    value={newProject.subject}
                    onChange={(e) => setNewProject({...newProject, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="language"
                    className="form-input w-full"
                    value={newProject.language}
                    onChange={(e) => setNewProject({...newProject, language: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="factory" className="block text-sm font-medium text-gray-700 mb-1">
                    Factory
                  </label>
                  <select
                    id="factory"
                    className="form-select w-full"
                    value={newProject.factory}
                    onChange={(e) => setNewProject({...newProject, factory: e.target.value})}
                  >
                    <option value="Mahape">Mahape</option>
                    <option value="Taloja">Taloja</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="form-select w-full"
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-input w-full"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-input w-full"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="totalQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    id="totalQuantity"
                    className="form-input w-full"
                    value={newProject.totalQuantity}
                    onChange={(e) => setNewProject({...newProject, totalQuantity: e.target.value})}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddProject(false);
                    setNewProject({
                      name: '',
                      clientId: '',
                      client: '',
                      subject: '',
                      language: '',
                      factory: 'Mahape',
                      startDate: '',
                      endDate: '',
                      totalQuantity: '',
                      status: 'ongoing'
                    });
                  }}
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
      
      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Project</h3>
            </div>
            <form onSubmit={handleUpdateProject} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editProjectName"
                    className="form-input w-full"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editClient" className="block text-sm font-medium text-gray-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="editClient"
                    className="form-select w-full"
                    value={newProject.clientId}
                    onChange={(e) => {
                      const selectedClient = clients.find(c => c.id === parseInt(e.target.value));
                      setNewProject({
                        ...newProject,
                        clientId: e.target.value,
                        client: selectedClient ? selectedClient.name : ''
                      });
                    }}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="editSubject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editSubject"
                    className="form-input w-full"
                    value={newProject.subject}
                    onChange={(e) => setNewProject({...newProject, subject: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="editLanguage"
                    className="form-input w-full"
                    value={newProject.language}
                    onChange={(e) => setNewProject({...newProject, language: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editFactory" className="block text-sm font-medium text-gray-700 mb-1">
                    Factory
                  </label>
                  <select
                    id="editFactory"
                    className="form-select w-full"
                    value={newProject.factory}
                    onChange={(e) => setNewProject({...newProject, factory: e.target.value})}
                  >
                    <option value="Mahape">Mahape</option>
                    <option value="Taloja">Taloja</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="editStatus"
                    className="form-select w-full"
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="editStartDate"
                    className="form-input w-full"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="editEndDate"
                    className="form-input w-full"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="editTotalQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    id="editTotalQuantity"
                    className="form-input w-full"
                    value={newProject.totalQuantity}
                    onChange={(e) => setNewProject({...newProject, totalQuantity: e.target.value})}
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditProject(false);
                    setProjectToEdit(null);
                    setNewProject({
                      name: '',
                      clientId: '',
                      client: '',
                      subject: '',
                      language: '',
                      factory: 'Mahape',
                      startDate: '',
                      endDate: '',
                      totalQuantity: '',
                      status: 'ongoing'
                    });
                  }}
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
      
      {/* Delete Confirmation Alert */}
      {showDeleteAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Confirm Delete</h3>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete the project <strong>{projectToDelete?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteAlert(false);
                  setProjectToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDeleteProject}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}