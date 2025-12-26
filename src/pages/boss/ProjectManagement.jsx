import { useState, useEffect } from 'react';
import CustomAlert from '../../components/CustomAlert';
import DataService from '../../services/dataService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { logActivity } from '../../utils/activityLogger';

// Load projects using DataService
const loadProjects = async () => {
  try {
    const projects = await DataService.getProjects();
    return projects;
  } catch (error) {
    console.error('Error loading projects:', error);
    return [];
  }
};

// Load production entries from localStorage
const loadProductionEntries = () => {
  try {
    // Load data from all factories
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

// Calculate total produced quantity from supervisor entries
const calculateProducedQuantity = (projectId, entries) => {
  return entries
    .filter(entry => parseInt(entry.projectId) === parseInt(projectId))
    .reduce((total, entry) => total + (parseInt(entry.quantity) || 0), 0);
};

// Factory options
const factoryOptions = ['Mahape', 'Taloja'];

// Empty invoices array
const mockInvoices = [];

// Load invoices from localStorage or use initial empty array
const loadInvoicesFromLocalStorage = () => {
  const savedInvoices = localStorage.getItem('accountantInvoices');
  return savedInvoices ? JSON.parse(savedInvoices) : mockInvoices;
};

export default function ProjectManagement({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productionEntries, setProductionEntries] = useState([]);

  // Load projects and production entries on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [loadedProjects, loadedEntries] = await Promise.all([
          loadProjects(),
          loadProductionEntries()
        ]);
        
        // Calculate produced quantities for each project
        const projectsWithProgress = loadedProjects.map(project => {
          const produced = calculateProducedQuantity(project.id, loadedEntries);
          // Update status based on progress
          let status = project.status || 'pending';
          
          // Only auto-update status if it was auto-calculated
          // If a status was manually set, preserve it unless the project is truly completed
          const expectedAutoStatus = produced >= project.totalQuantity ? 'completed' : (produced > 0 ? 'ongoing' : 'pending');
                  
          // Preserve manual status updates unless project is actually completed
          if (produced >= project.totalQuantity) {
            status = 'completed'; // Always set to completed if truly completed
          } else {
            status = project.status || expectedAutoStatus; // Keep manual status or use auto if none
          }
          
          return {
            ...project,
            produced: produced,
            status: status
          };
        });
        
        setProjects(projectsWithProgress);
        setProductionEntries(loadedEntries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const [clients, setClients] = useState(() => {
    const savedClients = localStorage.getItem('bossClients');
    return savedClients ? JSON.parse(savedClients) : [];
  });
  const [invoices, setInvoices] = useState(loadInvoicesFromLocalStorage());
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
  });
  const [newInvoice, setNewInvoice] = useState({ file: null });

  // Refresh clients when localStorage changes
  const refreshClients = () => {
    const savedClients = localStorage.getItem('bossClients');
    setClients(savedClients ? JSON.parse(savedClients) : []);
  };

  // Refresh projects when localStorage changes
  const refreshProjects = () => {
    const savedProjects = localStorage.getItem('bossProjects');
    setProjects(savedProjects ? JSON.parse(savedProjects) : []);
  };

  // Refresh invoices when localStorage changes
  const refreshInvoices = () => {
    const savedInvoices = localStorage.getItem('accountantInvoices');
    setInvoices(savedInvoices ? JSON.parse(savedInvoices) : []);
  };

  // State for viewing project production details
  const [showProjectProduction, setShowProjectProduction] = useState(false);
  const [selectedProjectForProduction, setSelectedProjectForProduction] = useState(null);

  // Function to view project production details
  const handleViewProjectProduction = (project) => {
    setSelectedProjectForProduction(project);
    setShowProjectProduction(true);
  };

  // Save projects to localStorage
  const saveProjectsToLocalStorage = (projects) => {
    localStorage.setItem('bossProjects', JSON.stringify(projects));
  };

  // Save invoices to localStorage
  const saveInvoicesToLocalStorage = (invoices) => {
    localStorage.setItem('accountantInvoices', JSON.stringify(invoices));
  };

  // Listen for storage changes (when projects/clients are added/edited)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bossClients') {
        refreshClients();
      } else if (e.key === 'bossProjects') {
        refreshProjects();
      } else if (e.key === 'accountantInvoices') {
        refreshInvoices();
      } else if (e.key === 'dailyEntries_Mahape' || e.key === 'dailyEntries_Taloja') {
        refreshProjectProgress();
      }
    };

    // Handle custom production entry events
    const handleProductionEntryAdded = () => {
      refreshProjectProgress();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productionEntryAdded', handleProductionEntryAdded);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productionEntryAdded', handleProductionEntryAdded);
    };
  }, []);

  // Function to update project progress based on current production entries
  const refreshProjectProgress = () => {
    // Refresh production entries and update project progress
    const loadedEntries = loadProductionEntries();
    setProductionEntries(loadedEntries);
    
    // Recalculate project progress
    const updatedProjects = projects.map(project => {
      const produced = calculateProducedQuantity(project.id, loadedEntries);
      // Update status based on progress
      let status = project.status || 'pending';
      
      // Only auto-update status if it was auto-calculated
      // If a status was manually set, preserve it unless the project is truly completed
      const expectedAutoStatus = produced >= project.totalQuantity ? 'completed' : (produced > 0 ? 'ongoing' : 'pending');
      
      // Preserve manual status updates unless project is actually completed
      if (produced >= project.totalQuantity) {
        status = 'completed'; // Always set to completed if truly completed
      } else {
        status = project.status || expectedAutoStatus; // Keep manual status or use auto if none
      }
      
      return {
        ...project,
        produced: produced,
        status: status
      };
    });
    
    setProjects(updatedProjects);
  };

  // Listen for storage changes (when projects/clients are added/edited)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'bossClients') {
        refreshClients();
      } else if (e.key === 'bossProjects') {
        refreshProjects();
      } else if (e.key === 'accountantInvoices') {
        refreshInvoices();
      } else if (e.key === 'dailyEntries_Mahape' || e.key === 'dailyEntries_Taloja') {
        refreshProjectProgress();
      }
    };

    // Handle custom production entry events
    const handleProductionEntryAdded = () => {
      refreshProjectProgress();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productionEntryAdded', handleProductionEntryAdded);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productionEntryAdded', handleProductionEntryAdded);
    };
  }, []);

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProject = (e) => {
    e.preventDefault();
    
    // Get client name from ID
    const client = clients.find(c => c.id === parseInt(newProject.clientId));
    
    // Create new project with unique ID
    const projectToAdd = {
      id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
      name: newProject.name,
      client: client ? client.name : 'Unknown Client',
      subject: newProject.subject,
      language: newProject.language,
      totalQuantity: parseInt(newProject.totalQuantity) || 0,
      produced: 0,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      factory: newProject.factory,
      status: newProject.status || 'pending'
    };
    
    // Add to projects state
    const updatedProjects = [...projects, projectToAdd];
    setProjects(updatedProjects);
    // Save to localStorage
    saveProjectsToLocalStorage(updatedProjects);
    // Clear DataService cache to ensure other components get updated data
    DataService.clearCache('projects_all');
    DataService.clearCache('projects');
    
    // Log activity
    logActivity(user, 'created', 'project', projectToAdd.name);
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project created successfully!', 'success');
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

  const handleEditProject = (project) => {
    setProjectToEdit(project);
    // Find client ID from client name
    const client = clients.find(c => c.name === project.client);
    setNewProject({
      name: project.name,
      clientId: client ? client.id.toString() : '',
      subject: project.subject,
      language: project.language,
      totalQuantity: project.totalQuantity.toString(),
      startDate: project.startDate,
      endDate: project.endDate,
      factory: project.factory
    });
    setShowEditProject(true);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    
    // Get client name from ID
    const client = clients.find(c => c.id === parseInt(newProject.clientId));
    
    // Update project in state
    const updatedProjects = projects.map(project => 
      parseInt(project.id) === parseInt(projectToEdit.id) 
        ? {
            ...project,
            name: newProject.name,
            client: client ? client.name : 'Unknown Client',
            subject: newProject.subject,
            language: newProject.language,
            totalQuantity: parseInt(newProject.totalQuantity) || 0,
            startDate: newProject.startDate,
            endDate: newProject.endDate,
            factory: newProject.factory,
            status: newProject.status || project.status || 'pending'
          }
        : project
    );
    
    setProjects(updatedProjects);
    // Save to localStorage
    saveProjectsToLocalStorage(updatedProjects);
    // Clear DataService cache to ensure other components get updated data
    DataService.clearCache('projects_all');
    DataService.clearCache('projects');
    
    // Log activity
    logActivity(user, 'updated', 'project', projectToEdit.name);
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project updated successfully!', 'success');
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
    setShowEditProject(false);
    setProjectToEdit(null);
  };

  const handleDeleteProject = (project) => {
    setProjectToDelete(project);
    setShowDeleteAlert(true);
  };

  const confirmDeleteProject = () => {
    // Remove project from state
    const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
    setProjects(updatedProjects);
    // Save to localStorage
    saveProjectsToLocalStorage(updatedProjects);
    // Clear DataService cache to ensure other components get updated data
    DataService.clearCache('projects_all');
    DataService.clearCache('projects');
    
    // Log activity
    logActivity(user, 'deleted', 'project', projectToDelete.name);
    
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Project deleted successfully!', 'success');
    }
    
    // Close alert
    setShowDeleteAlert(false);
    setProjectToDelete(null);
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
      uploadedBy: user.role === 'SUPER_ADMIN' ? 'Boss' : 'Accountant'
    };

    // Add to invoices state and save to localStorage
    const updatedInvoices = [...invoices, invoiceToAdd];
    setInvoices(updatedInvoices);
    saveInvoicesToLocalStorage(updatedInvoices);

    // Log activity
    const project = projects.find(p => p.id === selectedProject);
    logActivity(user, 'uploaded invoice for', 'project', project ? project.name : 'Unknown Project', { fileName: newInvoice.file.name });
        
    // Show success message
    if (typeof window.addToast === 'function') {
      window.addToast('Invoice uploaded successfully!', 'success');
    }
        
    // Reset form and close modal
    setNewInvoice({ file: null });
    setShowUploadModal(false);
    setSelectedProject(null);
  };

  const handleFileUpload = (projectId) => {
    // Set the selected project and open the upload modal
    setSelectedProject(projectId);
    setShowUploadModal(true);
  };

  const handleFileOpen = (fileName) => {
    // In a real application, this would open the actual Excel file from the server
    // For demo purposes, we'll create a downloadable CSV file that can be opened in Excel
    
    // Create a sample CSV content (in real app, this would come from the server)
    const csvContent = `Project Invoice Data
File,${fileName}
Uploaded on,${new Date().toLocaleDateString()}
Uploaded by,${user.role === 'SUPER_ADMIN' ? 'Boss' : 'Accountant'}

Sample Invoice Data:
Client,Sample Client
Project,Sample Project
Invoice Date,${new Date().toLocaleDateString()}
Amount,₹${Math.floor(Math.random() * 100000 + 10000)}

Description,Quantity,Unit Price,Total
Printing Services,1000,₹50,₹50000
Binding Services,1000,₹20,₹20000
Cover Design,1,₹5000,₹5000
Grand Total,,,"₹75000"`;

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
    return invoices.filter(invoice => parseInt(invoice.projectId) === parseInt(projectId));
  };

  // Function to recalculate produced quantity based on supervisor entries
  const updateProjectProgress = (projectId, additionalQuantity) => {
    const updatedProjects = projects.map(project => {
      if (parseInt(project.id) === parseInt(projectId)) {
        const newProduced = project.produced + additionalQuantity;
        // Update status based on progress
        
        // Only auto-update status if it was auto-calculated
        // If a status was manually set, preserve it unless the project is truly completed
        const expectedAutoStatus = newProduced >= project.totalQuantity ? 'completed' : (newProduced > 0 ? 'ongoing' : 'pending');
        
        // Preserve manual status updates unless project is actually completed
        let newStatus;
        if (newProduced >= project.totalQuantity) {
          newStatus = 'completed'; // Always set to completed if truly completed
        } else {
          newStatus = project.status || expectedAutoStatus; // Keep manual status or use auto if none
        }
        
        return {
          ...project,
          produced: newProduced,
          status: newStatus
        };
      }
      return project;
    });
    
    setProjects(updatedProjects);
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Manage Projects</h2>
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
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
            <thead className="bg-gray-50">
              <tr>
                <th className="min-w-[150px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                <th className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="min-w-[150px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject/Language</th>
                <th className="min-w-[180px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                <th className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="min-w-[180px] px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const projectInvoices = getProjectInvoices(project.id);
                  return (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 truncate" title={project.name}>{project.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.client}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {project.factory}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm truncate" title={project.startDate}>{project.startDate}</div>
                        <div className="text-sm text-gray-500 truncate" title={`to ${project.endDate}`}>to {project.endDate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                        
                        {/* Display uploaded invoices - only for bosses and accountants */}
                        {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && projectInvoices.length > 0 && (
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
                              {projectInvoices.length > 3 && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                  </svg>
                                  +{projectInvoices.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12">
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
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-900 truncate">{project.name}</div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          project.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          {project.produced >= project.totalQuantity && project.status === 'completed' && (
                            <span className="ml-1 text-xs">(Auto)</span>
                          )}
                        </span>
                      </div>
                      <div className="text-sm text-gray-900 mb-1">{project.client}</div>
                      <div className="text-sm text-gray-700 mb-1">
                        <div className="truncate">{project.subject}</div>
                        <div className="text-gray-500 truncate">{project.language}</div>
                      </div>
                      <div className="mb-2">
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
                        <div className="text-sm text-gray-500">
                          {project.produced.toLocaleString()} / {project.totalQuantity.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">
                          Based on real-time supervisor entries
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {project.factory}
                        </span>
                        <div className="text-xs text-gray-700">
                          <div>{project.startDate}</div>
                          <div className="text-gray-500">to {project.endDate}</div>
                        </div>
                      </div>
                      
                      {/* Display uploaded invoices - only for bosses and accountants */}
                      {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && projectInvoices.length > 0 && (
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
                            {projectInvoices.length > 3 && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                                </svg>
                                +{projectInvoices.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col gap-1">
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

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Project</h3>
            </div>
            <form onSubmit={handleAddProject}>
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
                    value={newProject.clientId}
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
                    value={newProject.status || 'pending'}
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
                  onClick={() => setShowAddProject(false)}
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

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Project</h3>
            </div>
            <form onSubmit={handleUpdateProject}>
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
                    value={newProject.clientId}
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
                    value={newProject.status || 'pending'}
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
                  onClick={() => setShowEditProject(false)}
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

      {/* Delete Confirmation Alert */}
      <CustomAlert
        isOpen={showDeleteAlert}
        onClose={() => {
          setShowDeleteAlert(false)
          setProjectToDelete(null)
        }}
        title="Delete Project"
        message={`Are you sure you want to delete ${projectToDelete?.name}? This action cannot be undone.`}
        type="warning"
        onConfirm={confirmDeleteProject}
      />

      {/* Upload Invoice Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upload Invoice</h3>
            </div>
            <form onSubmit={handleUploadSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Invoice File</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">XLSX, CSV (MAX. 10MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => setNewInvoice({...newInvoice, file: e.target.files[0]})}
                      />
                    </label>
                  </div>
                  {newInvoice.file && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {newInvoice.file.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedProject(null);
                    setNewInvoice({ file: null });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newInvoice.file}
                >
                  Upload Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Production Details Modal */}
      {showProjectProduction && selectedProjectForProduction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Production Details - {selectedProjectForProduction.name}
              </h3>
              <button
                onClick={() => setShowProjectProduction(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {/* Production Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">Total Quantity</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedProjectForProduction.totalQuantity?.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Produced</p>
                  <p className="text-2xl font-bold text-green-900">{selectedProjectForProduction.produced?.toLocaleString() || 0}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-800 font-medium">Remaining</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {Math.max(0, (selectedProjectForProduction.totalQuantity || 0) - (selectedProjectForProduction.produced || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Progress</span>
                  <span className="text-gray-600">
                    {selectedProjectForProduction.totalQuantity > 0 
                      ? Math.round(((selectedProjectForProduction.produced || 0) / selectedProjectForProduction.totalQuantity) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full" 
                    style={{ 
                      width: `${selectedProjectForProduction.totalQuantity > 0 
                        ? ((selectedProjectForProduction.produced || 0) / selectedProjectForProduction.totalQuantity) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Production Entries Table */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Recent Production Entries</h4>
                <div className="overflow-x-auto">
                  <table className="table-auto w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productionEntries
                        .filter(entry => parseInt(entry.projectId) === parseInt(selectedProjectForProduction.id))
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                        .slice(0, 10) // Show only last 10 entries
                        .map((entry, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {entry.factory}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.quantity?.toLocaleString()}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{entry.supervisorName || 'N/A'}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              
              {productionEntries.filter(entry => parseInt(entry.projectId) === parseInt(selectedProjectForProduction.id)).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No production entries found for this project.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}