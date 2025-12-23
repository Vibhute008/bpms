import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logActivity } from '../utils/activityLogger'

// Load users from localStorage or use default users
const loadUsers = () => {
  const savedUsers = localStorage.getItem('appUsers');
  if (savedUsers) {
    try {
      return JSON.parse(savedUsers);
    } catch (error) {
      console.error('Error parsing users from localStorage:', error);
      return getDefaultUsers();
    }
  }
  return getDefaultUsers();
};

// Default users data
const getDefaultUsers = () => [
  { id: 1, username: 'boss', password: 'boss123', name: 'Boss', role: 'SUPER_ADMIN', factory: null },
  { id: 2, username: 'accountant', password: 'acc123', name: 'Accountant', role: 'ADMIN', factory: null },
  { id: 3, username: 'mahape', password: 'sup123', name: 'Amit Patel', role: 'OPERATOR', factory: 'Mahape' },
  { id: 4, username: 'taloja', password: 'sup123', name: 'Sunita Verma', role: 'OPERATOR', factory: 'Taloja' }
];

// Initialize users in localStorage if not present
const initializeUsers = () => {
  if (!localStorage.getItem('appUsers')) {
    localStorage.setItem('appUsers', JSON.stringify(getDefaultUsers()));
  }
};

// Initialize users on app load
initializeUsers();

const mockUsers = loadUsers();

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    // Simulate API call delay
    setTimeout(() => {
      // Check against mock users
      const user = mockUsers.find(u => u.username === username && u.password === password)
      
      if (user) {
        // Successful login
        onLogin(user)
        
        // Log the login activity
        logActivity(user, 'login', 'user session', `${user.name} (${user.role})`, {
          userId: user.id,
          role: user.role,
          factory: user.factory
        });
        
        if (typeof window.addToast === 'function') {
          window.addToast(`Welcome ${user.name}!`, 'success')
        }
        // Navigate based on role and factory mapping
        switch(user.role) {
          case 'SUPER_ADMIN':
            navigate('/boss/dashboard')
            break
          case 'ADMIN':
            navigate('/accountant/production-view')
            break
          case 'OPERATOR':
            // Navigate to factory-specific production view
            navigate(`/supervisor/${user.factory.toLowerCase()}/production-view`)
            break
          default:
            navigate('/login')
        }
      } else {
        // Failed login
        setError('Invalid credentials. Please try again.')
        if (typeof window.addToast === 'function') {
          window.addToast('Invalid credentials', 'error')
        }
      }
      setIsLoading(false)
    }, 800)
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-8 px-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="text-2xl text-white">📚</span>
          </div>
          <h1 className="text-3xl font-bold text-white">BPMS Login</h1>
          <p className="mt-2 text-blue-200 font-light">Book Production Management System</p>
        </div>
        
        <div className="py-8 px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
          


          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Book Production Management System</p>
              <p className="font-medium">v1.0 Professional Edition</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}