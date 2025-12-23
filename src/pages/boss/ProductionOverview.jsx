import { useState, useEffect } from 'react';

// Function to load production data from localStorage
const loadProductionData = () => {
  const mahapeEntries = localStorage.getItem('dailyEntries_Mahape');
  const talojaEntries = localStorage.getItem('dailyEntries_Taloja');
  
  const mahapeData = mahapeEntries ? JSON.parse(mahapeEntries) : [];
  const talojaData = talojaEntries ? JSON.parse(talojaEntries) : [];
  
  return [...mahapeData, ...talojaData];
};

export default function ProductionOverview({ user, onLogout }) {
  const [entries, setEntries] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);

  // Load data
  useEffect(() => {
    const loadedEntries = loadProductionData();
    
    setEntries(loadedEntries);
  }, []);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dailyEntries_Mahape' || e.key === 'dailyEntries_Taloja') {
        // Reload data when localStorage changes
        const loadedEntries = loadProductionData();
        
        setEntries(loadedEntries);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleEntryExpansion = (entryId) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };



  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Overview</h1>
        <p className="text-gray-600">Monitor factory production and supervisor activities</p>
      </div>



      {/* Supervisor Entries Section */}
      <div className="card mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Supervisor Entries</h3>
        </div>
        <div className="p-6">
          {entries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.slice(0, 6).map(entry => (
                <div 
                  key={entry.id} 
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                  onClick={() => toggleEntryExpansion(entry.id === expandedEntry ? null : entry.id)}
                >
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{entry.projectName}</h4>
                        <p className="text-sm text-gray-600">Project #{entry.projectId} • {entry.date}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {entry.quantity.toLocaleString()} units
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>{entry.date}</span>
                      <span>{entry.photos ? entry.photos.length : 0} photos</span>
                    </div>
                  </div>
                  
                  {expandedEntry === entry.id && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {entry.photos && entry.photos.map(photo => (
                          <div key={photo.id} className="aspect-square">
                            <img 
                              src={photo.url} 
                              alt={photo.name} 
                              className="w-full h-full object-cover rounded border border-gray-300"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">
                        Uploaded on {new Date(entry.date).toLocaleDateString()}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-gray-600 mt-2">
                          Notes: {entry.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No supervisor entries</h3>
              <p className="mt-1 text-gray-500">Supervisors have not submitted any entries yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}