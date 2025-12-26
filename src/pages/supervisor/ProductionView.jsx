import { useState, useEffect } from 'react';
import { logActivity } from '../../utils/activityLogger';

// Function to load production data from localStorage
const loadProductionData = (factory = null) => {
  if (factory) {
    // Load data for a specific factory
    const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
    return factoryEntries ? JSON.parse(factoryEntries) : [];
  } else {
    // Load data from all factories
    const mahapeEntries = localStorage.getItem('dailyEntries_Mahape');
    const talojaEntries = localStorage.getItem('dailyEntries_Taloja');
    
    const mahapeData = mahapeEntries ? JSON.parse(mahapeEntries) : [];
    const talojaData = talojaEntries ? JSON.parse(talojaEntries) : [];
    
    return [...mahapeData, ...talojaData];
  }
};

// Function to save production data to localStorage
const saveProductionData = (factory, entries) => {
  localStorage.setItem(`dailyEntries_${factory}`, JSON.stringify(entries));
};

// Function to load projects from localStorage
const loadProjects = () => {
  const savedProjects = localStorage.getItem('bossProjects');
  return savedProjects ? JSON.parse(savedProjects) : [];
};



export default function ProductionView({ user, onLogout }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);
  
  // Form state for new entry
  const [newEntry, setNewEntry] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    notes: '',
    photos: []
  });
  
  // Preview URLs for photos
  const [previewUrls, setPreviewUrls] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // Load data based on user role
  useEffect(() => {
    let loadedEntries = [];
    const loadedProjects = loadProjects();
    
    if (user.role === 'OPERATOR') {
      // Supervisors see only their factory's data
      loadedEntries = loadProductionData(user.factory);
    } else {
      // Boss and Accountant see all data
      loadedEntries = loadProductionData();
    }
    
    setEntries(loadedEntries);
    setFilteredEntries(loadedEntries);
    setProjects(loadedProjects);
  }, [user]);

  // Apply filters
  useEffect(() => {
    let result = entries;
    
    if (dateFilter) {
      result = result.filter(entry => entry.date === dateFilter);
    }
    
    if (projectFilter) {
      result = result.filter(entry => 
        entry.projectName && entry.projectName.toLowerCase().includes(projectFilter.toLowerCase())
      );
    }
    
    setFilteredEntries(result);
  }, [dateFilter, projectFilter, entries]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dailyEntries_Mahape' || e.key === 'dailyEntries_Taloja' || e.key === 'bossProjects') {
        // Reload data when localStorage changes
        let loadedEntries = [];
        const loadedProjects = loadProjects();
        
        if (user.role === 'OPERATOR') {
          loadedEntries = loadProductionData(user.factory);
        } else {
          loadedEntries = loadProductionData();
        }
        
        setEntries(loadedEntries);
        setProjects(loadedProjects);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const toggleEntryExpansion = (entryId) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate file types
    const validFiles = files.filter(file => file.type.match('image.*'));
    if (validFiles.length !== files.length) {
      alert('Some files were not images and were skipped');
    }
    
    // Validate file sizes (10MB limit each)
    const validSizeFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);
    if (validSizeFiles.length !== validFiles.length) {
      alert('Some files exceeded 10MB limit and were skipped');
    }
    
    if (validSizeFiles.length === 0) return;
    
    // Limit to 10 photos max
    const finalFiles = validSizeFiles.slice(0, 10 - newEntry.photos.length);
    if (finalFiles.length !== validSizeFiles.length) {
      alert(`Only 10 photos allowed. ${validSizeFiles.length - finalFiles.length} photos were skipped.`);
    }
    
    if (finalFiles.length === 0) return;
    
    // Update state
    setNewEntry(prev => ({
      ...prev,
      photos: [...prev.photos, ...finalFiles]
    }));
    
    // Create preview URLs
    const urls = finalFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  // Remove a specific photo
  const removePhoto = (index) => {
    const newPhotos = [...newEntry.photos];
    const newUrls = [...previewUrls];
    
    // Clean up the URL
    if (newUrls[index] && newUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(newUrls[index]);
    }
    
    newPhotos.splice(index, 1);
    newUrls.splice(index, 1);
    
    setNewEntry(prev => ({
      ...prev,
      photos: newPhotos
    }));
    setPreviewUrls(newUrls);
  };

  // Handle add new entry
  const handleAddEntry = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newEntry.projectId || !newEntry.date || !newEntry.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    const quantityValue = parseInt(newEntry.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    // Get project details
    const project = projects.find(p => p.id === parseInt(newEntry.projectId));
    if (!project) {
      alert('Selected project not found');
      return;
    }
    
    // For supervisors, ensure they can only add entries for their factory
    if (user.role === 'OPERATOR' && project.factory !== user.factory) {
      alert('You can only add entries for projects assigned to your factory');
      return;
    }
    
    // Convert photos to base64
    const photosWithBase64 = await Promise.all(newEntry.photos.map(async (photo, index) => {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(photo);
      });
      
      return {
        id: Date.now() + index,
        name: photo.name,
        url: base64
      };
    }));
    
    // Create new entry
    const entry = {
      id: Date.now(),
      projectId: parseInt(newEntry.projectId),
      projectName: project.name,
      date: newEntry.date,
      quantity: quantityValue,
      notes: newEntry.notes,
      photos: photosWithBase64
    };
    
    // Save to localStorage
    const factory = user.role === 'OPERATOR' ? user.factory : project.factory;
    const factoryEntries = loadProductionData(factory);
    factoryEntries.unshift(entry);
    saveProductionData(factory, factoryEntries);
    
    // Log activity
    logActivity(user, 'created', 'production entry', `${entry.projectName} - ${entry.quantity} units`, {
      projectId: entry.projectId,
      date: entry.date
    });
    
    // Dispatch custom event to notify other components of production entry update
    window.dispatchEvent(new CustomEvent('productionEntryAdded', { detail: { factory, projectId: entry.projectId } }));
    
    // Update state
    if (user.role === 'OPERATOR' && user.factory === factory) {
      setEntries(prev => [entry, ...prev]);
      setFilteredEntries(prev => [entry, ...prev]);
    } else if (user.role !== 'OPERATOR') {
      setEntries(prev => [entry, ...prev]);
      setFilteredEntries(prev => [entry, ...prev]);
    }
    
    // Reset form
    setNewEntry({
      projectId: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      notes: '',
      photos: []
    });
    
    // Clean up preview URLs
    previewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setPreviewUrls([]);
    
    // Close modal
    setShowAddModal(false);
    
    alert('Production entry added successfully!');
  };

  // Handle edit entry
  const handleEditEntry = (entry) => {
    setEntryToEdit(entry);
    setNewEntry({
      projectId: entry.projectId.toString(),
      date: entry.date,
      quantity: entry.quantity.toString(),
      notes: entry.notes || '',
      photos: entry.photos || []
    });
    
    // Set preview URLs for existing photos
    if (entry.photos && entry.photos.length > 0) {
      const urls = entry.photos.map(photo => photo.url);
      setPreviewUrls(urls);
    } else {
      setPreviewUrls([]);
    }
    
    setShowEditModal(true);
  };

  // Handle update entry
  const handleUpdateEntry = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newEntry.projectId || !newEntry.date || !newEntry.quantity) {
      alert('Please fill in all required fields');
      return;
    }
    
    const quantityValue = parseInt(newEntry.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    // Get project details
    const project = projects.find(p => p.id === parseInt(newEntry.projectId));
    if (!project) {
      alert('Selected project not found');
      return;
    }
    
    // For supervisors, ensure they can only edit entries for their factory
    if (user.role === 'OPERATOR' && project.factory !== user.factory) {
      alert('You can only edit entries for projects assigned to your factory');
      return;
    }
    
    // Convert photos to base64 if they are File objects, otherwise keep existing base64
    const photosWithBase64 = await Promise.all(newEntry.photos.map(async (photo, index) => {
      // If photo is already a base64 string (existing photo), keep it as is
      if (typeof photo === 'object' && photo.url && !photo.url.startsWith('blob:')) {
        return photo;
      }
      
      // If photo is a File object (newly added photo), convert to base64
      if (photo instanceof File) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(photo);
        });
        
        return {
          id: Date.now() + index,
          name: photo.name,
          url: base64
        };
      }
      
      // If photo is already in the correct format, return as is
      return photo;
    }));
    
    // Update entry
    const updatedEntry = {
      ...entryToEdit,
      projectId: parseInt(newEntry.projectId),
      projectName: project.name,
      date: newEntry.date,
      quantity: quantityValue,
      notes: newEntry.notes,
      photos: photosWithBase64
    };
    
    // Save to localStorage
    const factory = user.role === 'OPERATOR' ? user.factory : project.factory;
    const factoryEntries = loadProductionData(factory).map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
    saveProductionData(factory, factoryEntries);
    
    // Update state
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    setFilteredEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    
    // Log activity
    logActivity(user, 'update', 'production entry', `${updatedEntry.projectName} - ${updatedEntry.quantity} units`, {
      projectId: updatedEntry.projectId,
      date: updatedEntry.date
    });
    
    // Close modal
    setShowEditModal(false);
    setEntryToEdit(null);
    
    alert('Production entry updated successfully!');
  };

  // Handle delete entry
  const handleDeleteEntry = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteAlert(true);
  };

  // Confirm delete entry
  const confirmDeleteEntry = () => {
    if (!entryToDelete) return;
    
    // Get factory for the entry
    let factory = '';
    if (user.role === 'OPERATOR') {
      factory = user.factory;
    } else {
      // For boss/accountant, find the factory from the project
      const project = projects.find(p => p.id === entryToDelete.projectId);
      factory = project ? project.factory : '';
    }
    
    // Remove from localStorage
    const factoryEntries = loadProductionData(factory).filter(entry => 
      entry.id !== entryToDelete.id
    );
    saveProductionData(factory, factoryEntries);
    
    // Update state
    setEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
    setFilteredEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
    
    // Log activity
    logActivity(user, 'delete', 'production entry', `${entryToDelete.projectName} - ${entryToDelete.quantity} units`, {
      projectId: entryToDelete.projectId,
      date: entryToDelete.date
    });
    
    // Close alert
    setShowDeleteAlert(false);
    setEntryToDelete(null);
    
    alert('Production entry deleted successfully!');
  };

  // Filter projects based on user role
  const getAvailableProjects = () => {
    if (user.role === 'OPERATOR') {
      return projects.filter(project => project.factory === user.factory);
    }
    return projects;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
            <p className="text-gray-600 mt-1">
              {user.role === 'OPERATOR' 
                ? `Managing production data for ${user.factory} factory` 
                : 'Managing consolidated production data from all factories'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'OPERATOR') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Production
              </button>
            )}
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
              Live Data
            </div>
          </div>
        </div>
        <div className="w-full h-px bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-height-44"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Project</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-height-44"
                placeholder="Project name..."
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-lg hover:from-gray-700 hover:to-gray-900 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                onClick={() => {
                  setDateFilter('');
                  setProjectFilter('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Production Entries Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Production Entries</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredEntries.length} of {entries.length} entries
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
              Real-time Data
            </div>
          </div>
        </div>
        {/* Table view for larger screens */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.projectName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(entry.quantity)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.photos ? entry.photos.length : 0} photos</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No production entries found</h3>
                      <p className="mt-1 text-gray-500 max-w-md mx-auto">
                        {user.role === 'OPERATOR' 
                          ? 'No production data has been entered for your factory yet. Start by adding production entries in the Daily Entry section.' 
                          : 'No production data has been entered yet. Supervisors need to submit daily production entries for data to appear here.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Card layout for mobile */}
        <div className="block md:hidden">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-4 mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">{entry.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Project</p>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{entry.projectName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-sm font-medium text-gray-900">{formatNumber(entry.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Photos</p>
                        <p className="text-sm font-medium text-gray-900">{entry.photos ? entry.photos.length : 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button 
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 transition-all duration-200"
                      onClick={() => toggleEntryExpansion(entry.id)}
                    >
                      {expandedEntry === entry.id ? 'Hide' : 'View'}
                    </button>
                    {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || (user.role === 'OPERATOR' && entry.projectId && projects.find(p => p.id === entry.projectId)?.factory === user.factory)) && (
                      <>
                        <button 
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-all duration-200"
                          onClick={() => handleEditEntry(entry)}
                        >
                          Edit
                        </button>
                        <button 
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-all duration-200"
                          onClick={() => handleDeleteEntry(entry)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center justify-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No production entries found</h3>
                <p className="mt-1 text-gray-500 max-w-md mx-auto">
                  {user.role === 'OPERATOR' 
                    ? 'No production data has been entered for your factory yet. Start by adding production entries in the Daily Entry section.' 
                    : 'No production data has been entered yet. Supervisors need to submit daily production entries for data to appear here.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Entry Details */}
      {expandedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Production Entry Details</h3>
                <button 
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  onClick={() => setExpandedEntry(null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">Detailed view of production entry information</p>
            </div>
              
              {entries.find(e => e.id === expandedEntry) && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <p className="text-lg font-semibold text-gray-900">{entries.find(e => e.id === expandedEntry).date}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                      <p className="text-lg font-semibold text-gray-900">{entries.find(e => e.id === expandedEntry).projectName}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <p className="text-lg font-semibold text-gray-900">{formatNumber(entries.find(e => e.id === expandedEntry).quantity)} units</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Factory</label>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${entries.find(e => e.id === expandedEntry).projectName.includes('Mahape') ? 'bg-green-100 text-green-800' : entries.find(e => e.id === expandedEntry).projectName.includes('Taloja') ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                          {entries.find(e => e.id === expandedEntry).projectName.includes('Mahape') ? 'Mahape' : entries.find(e => e.id === expandedEntry).projectName.includes('Taloja') ? 'Taloja' : 'Unknown'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-lg font-semibold text-gray-800">Production Photos</label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {entries.find(e => e.id === expandedEntry).photos ? entries.find(e => e.id === expandedEntry).photos.length : 0} photos
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {entries.find(e => e.id === expandedEntry).photos && entries.find(e => e.id === expandedEntry).photos.length > 0 ? (
                        entries.find(e => e.id === expandedEntry).photos.map((photo) => (
                          <div key={photo.id} className="group rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200">
                            <div 
                              className="relative overflow-hidden cursor-pointer"
                              onClick={() => setFullscreenImage(photo.url)}
                            >
                              <img 
                                src={photo.url} 
                                alt={`Production ${photo.name}`} 
                                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            </div>
                            <div className="p-3 bg-white border-t border-gray-200">
                              <p className="text-sm font-medium text-gray-900 truncate">{photo.name}</p>
                              <p className="text-xs text-gray-500 mt-1">Uploaded photo</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos available</h3>
                          <p className="mt-1 text-sm text-gray-500">No production photos were uploaded for this entry.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Add Production Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Add Production Entry</h3>
                <button 
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  onClick={() => {
                    setShowAddModal(false);
                    // Clean up preview URLs
                    previewUrls.forEach(url => {
                      if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                      }
                    });
                    setPreviewUrls([]);
                    setNewEntry({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      photos: []
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">Record production data with photos and notes</p>
            </div>
            
            <form onSubmit={handleAddEntry} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project *
                </label>
                <select
                  value={newEntry.projectId}
                  onChange={(e) => setNewEntry({...newEntry, projectId: e.target.value})}
                  className="form-select w-full"
                  required
                >
                  <option value="">Choose a project</option>
                  {getAvailableProjects().map(project => (
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
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
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
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({...newEntry, quantity: e.target.value})}
                  className="form-input w-full"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Enter the exact number of units produced</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="form-textarea w-full"
                  rows="3"
                  placeholder="Add any additional notes about this production entry..."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photos (Max 10)
                </label>
                
                {/* Photo Upload Area */}
                <div className="flex items-center justify-center w-full mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB each)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={newEntry.photos.length >= 10}
                    />
                  </label>
                </div>
                
                {/* Photo Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-20 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
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
                
                {newEntry.photos.length >= 10 && (
                  <p className="mt-2 text-sm text-yellow-600">Maximum of 10 photos reached</p>
                )}
                
                <p className="mt-1 text-sm text-gray-500">Take clear photos of today's work as proof. Optional but recommended.</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    // Clean up preview URLs
                    previewUrls.forEach(url => {
                      if (url.startsWith('blob:')) {
                        URL.revokeObjectURL(url);
                      }
                    });
                    setPreviewUrls([]);
                    setNewEntry({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      photos: []
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
                  Add Production Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Production Entry Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-800">Edit Production Entry</h3>
                <button 
                  className="p-2 rounded-full bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  onClick={() => {
                    setShowEditModal(false);
                    setEntryToEdit(null);
                    setNewEntry({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      photos: []
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">Update production data</p>
            </div>
            
            <form onSubmit={handleUpdateEntry} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project *
                </label>
                <select
                  value={newEntry.projectId}
                  onChange={(e) => setNewEntry({...newEntry, projectId: e.target.value})}
                  className="form-select w-full"
                  required
                >
                  <option value="">Choose a project</option>
                  {getAvailableProjects().map(project => (
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
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
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
                  value={newEntry.quantity}
                  onChange={(e) => setNewEntry({...newEntry, quantity: e.target.value})}
                  className="form-input w-full"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Enter the exact number of units produced</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="form-textarea w-full"
                  rows="3"
                  placeholder="Add any additional notes about this production entry..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photos (Max 10)
                </label>
                
                {/* Photo Upload Area */}
                <div className="flex items-center justify-center w-full mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 10MB each)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={newEntry.photos.length >= 10}
                    />
                  </label>
                </div>
                
                {/* Photo Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-20 object-cover rounded-md border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
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
                
                {newEntry.photos.length >= 10 && (
                  <p className="mt-2 text-sm text-yellow-600">Maximum of 10 photos reached</p>
                )}
                
                <p className="mt-1 text-sm text-gray-500">Take clear photos of today's work as proof. Optional but recommended.</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEntryToEdit(null);
                    setNewEntry({
                      projectId: '',
                      date: new Date().toISOString().split('T')[0],
                      quantity: '',
                      notes: '',
                      photos: []
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
                  Update Production Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Confirm Deletion</h3>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">Are you sure you want to delete this production entry? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteAlert(false);
                    setEntryToDelete(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEntry}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
              onClick={() => setFullscreenImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
