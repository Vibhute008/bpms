import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function NoInternet({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const handleRetry = () => {
    // In a real app, this would check for internet connectivity
    alert('Checking connection...')
    // For demo, we'll just reload the page
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg className="h-10 w-10 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">No Internet Connection</h2>
          <p className="mt-2 text-gray-600">
            Please check your network connection and try again.
          </p>
          <div className="mt-8 bg-red-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Offline Mode</h3>
            <p className="text-red-700 text-sm">
              Your entries will be saved locally and synced when connection is restored.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              variant="primary"
            >
              Retry Connection
            </Button>
            <Button
              onClick={() => navigate(`/supervisor/${user.factory.toLowerCase()}/production-view`)}
              variant="secondary"
            >
              Continue Offline
            </Button>
            <Button
              onClick={handleLogout}
              variant="link"
              size="sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}