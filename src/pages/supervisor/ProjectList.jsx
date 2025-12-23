import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataService from '../../services/dataService';

export default function ProjectList({ user, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch projects data
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const factoryProjects = await DataService.getProjects(user.factory);
        setProjects(factoryProjects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user.factory]);

  // Filter projects - show all projects assigned to this factory
  const filteredProjects = projects.filter(project => 
    (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
     project.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Assigned Projects</h2>
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

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 truncate">{project.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{project.client}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${{
                          ongoing: 'bg-green-100 text-green-800',
                          pending: 'bg-yellow-100 text-yellow-800',
                          delayed: 'bg-red-100 text-red-800',
                          completed: 'bg-blue-100 text-blue-800'
                        }[project.status] || 'bg-gray-100 text-gray-800'}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm mb-1">{project.subject}</p>
                        <p className="text-gray-500 text-xs">{project.language}</p>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">Progress</span>
                          <span className="text-gray-600">{Math.round((project.produced / project.totalQuantity) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${(project.produced / project.totalQuantity) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {project.produced.toLocaleString()} / {project.totalQuantity.toLocaleString()} books
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm mb-4">
                        <div>
                          <p className="font-medium text-gray-700">Start Date</p>
                          <p className="text-gray-600">{project.startDate}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">End Date</p>
                          <p className="text-gray-600">{project.endDate}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Factory</p>
                          <p className="text-gray-600">{project.factory}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-medium text-indigo-600">
                          {project.quantity} books
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No projects found</h3>
                  <p className="mt-1 text-gray-500">Try adjusting your search terms</p>
                </div>
              </div>
            )}
          </>
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
                <p>You can view project information but cannot create, edit, or delete projects.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}