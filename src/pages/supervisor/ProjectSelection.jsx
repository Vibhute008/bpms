import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

// Load projects from localStorage or use default projects
const loadProjects = () => {
  const savedProjects = localStorage.getItem('bossProjects');
  if (savedProjects) {
    try {
      return JSON.parse(savedProjects);
    } catch (error) {
      console.error('Error parsing projects from localStorage:', error);
      return getDefaultProjects();
    }
  }
  return getDefaultProjects();
};

// Default projects data
const getDefaultProjects = () => [
  { id: 1, name: 'English Grammar Book', subject: 'English', language: 'English', totalQuantity: 50000, produced: 25000, startDate: '2023-01-15', endDate: '2023-03-30', factory: 'Mahape', status: 'ongoing' },
  { id: 2, name: 'Mathematics Workbook', subject: 'Mathematics', language: 'Hindi', totalQuantity: 75000, produced: 30000, startDate: '2023-02-01', endDate: '2023-04-15', factory: 'Taloja', status: 'ongoing' },
  { id: 3, name: 'Science Reader', subject: 'Science', language: 'Marathi', totalQuantity: 30000, produced: 15000, startDate: '2023-01-10', endDate: '2023-03-20', factory: 'Mahape', status: 'ongoing' },
  { id: 4, name: 'Social Studies Guide', subject: 'Social Studies', language: 'English', totalQuantity: 40000, produced: 0, startDate: '2023-03-01', endDate: '2023-05-15', factory: 'Taloja', status: 'ongoing' }
];

// Initialize projects in localStorage if not present
const initializeProjects = () => {
  if (!localStorage.getItem('bossProjects')) {
    localStorage.setItem('bossProjects', JSON.stringify(getDefaultProjects()));
  }
};

// Initialize projects on app load
initializeProjects();

const mockProjects = loadProjects();

export default function ProjectSelection({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const handleSelectProject = (projectId) => {
    // Store the selected project ID in localStorage for the daily entry page
    localStorage.setItem('selectedProjectId', projectId);
    navigate(`/supervisor/${user.factory.toLowerCase()}/daily-entry`);
  };

  // Filter projects to only show ongoing projects assigned to this supervisor's factory
  const factoryProjects = mockProjects.filter(project => project.factory === user.factory && project.status === 'ongoing');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">📋 Select Project</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 hidden md:inline">Supervisor • {user.factory}</span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Assigned Projects</h2>
          <p className="mt-1 text-gray-600">Select a project to enter today's production data</p>
        </div>

        {factoryProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {factoryProjects.map(project => {
              const progressPercentage = Math.round((project.produced / project.totalQuantity) * 100);
              return (
                <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-gray-600 mt-1">{project.subject} • {project.language}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Ongoing
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-medium text-gray-700">
                          {project.produced.toLocaleString()} / {project.totalQuantity.toLocaleString()} units
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{width: `${progressPercentage}%`}}
                        ></div>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        {progressPercentage}% completed
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Ends: {new Date(project.endDate).toLocaleDateString()}
                      </div>
                      <Button
                        onClick={() => handleSelectProject(project.id)}
                        variant="primary"
                      >
                        Select Project
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No ongoing projects</h3>
            <p className="mt-1 text-gray-500">There are no active projects assigned to {user.factory} factory</p>
            <div className="mt-6">
              <Button 
                onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/production-view`)}
                variant="primary"
              >
                Back to Production View
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button 
            onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/production-view`)}
            variant="secondary"
          >
            ← Back to Production View
          </Button>
        </div>
      </main>
    </div>
  );
}