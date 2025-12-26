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
  const [invoices, setInvoices] = useState(loadInvoicesFromLocalStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ file: null });

  // Refresh projects when localStorage changes
  const refreshProjects = () => {
    const savedProjects = localStorage.getItem('bossProjects');
    setProjects(savedProjects ? JSON.parse(savedProjects) : []);
  };

  // Refresh clients when localStorage changes
  const refreshClients = () => {
    const savedClients = localStorage.getItem('bossClients');
    // Update mockClients reference if needed
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

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Project Management</h2>
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
                    <div className="ml-4">
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleFileUpload(project.id)}
                      >
                        Upload Invoice
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
    </div>
  );
}