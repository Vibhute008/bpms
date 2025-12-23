import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import BossDashboard from './pages/boss/BossDashboard'
// Removed dashboard imports since dashboard pages are removed



// Boss Pages
import ClientManagement from './pages/boss/ClientManagement'
import ProjectManagement from './pages/boss/ProjectManagement'
import ProductionOverview from './pages/boss/ProductionOverview'

import BossLayout from './layouts/BossLayout'

// Accountant Pages
import SharedProductionView from './components/ProductionView'
import AccountantProjectManagement from './pages/accountant/ProjectManagement'
import AccountantClientManagement from './pages/accountant/ClientManagement'
import AccountantLayout from './layouts/AccountantLayout'

// Supervisor Pages
import ClientDetails from './pages/supervisor/ClientDetails'
import ClientList from './pages/supervisor/ClientList'
import ProjectList from './pages/supervisor/ProjectList'

// Layouts
import SupervisorLayout from './layouts/SupervisorLayout'

// Global Components
import ToastContainer from './components/ToastContainer'

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('bpmsUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user data from localStorage');
        localStorage.removeItem('bpmsUser');
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Save to localStorage
    localStorage.setItem('bpmsUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Remove from localStorage
    localStorage.removeItem('bpmsUser');
    localStorage.removeItem('selectedProjectId');
  };

  // Protected Routes
  const BossRoute = ({ children }) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  const AccountantRoute = ({ children }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  const SupervisorRoute = ({ children, requiredFactory }) => {
    if (!currentUser || currentUser.role !== 'OPERATOR') {
      return <Navigate to="/login" />;
    }
    
    // If a specific factory is required, check if the user belongs to that factory
    if (requiredFactory && currentUser.factory !== requiredFactory) {
      return <Navigate to="/login" />;
    }
    
    return children;
  };


  return (
    <div className="App">
      <ToastContainer />
      <Routes>
        <Route 
          path="/" 
          element={currentUser ? (
            // Redirect based on role and factory
            currentUser.role === 'SUPER_ADMIN' ? (
              <Navigate to="/boss/dashboard" />
            ) : currentUser.role === 'ADMIN' ? (
              <Navigate to="/accountant/production-view" />
            ) : currentUser.role === 'OPERATOR' ? (
              <Navigate to={`/supervisor/${currentUser.factory.toLowerCase()}/production-view`} />
            ) : (
              <Navigate to="/login" />
            )
          ) : (
            <LoginPage onLogin={handleLogin} />
          )} 
        />
        <Route 
          path="/login" 
          element={currentUser ? (
            // Redirect based on role and factory
            currentUser.role === 'SUPER_ADMIN' ? (
              <Navigate to="/boss/dashboard" />
            ) : currentUser.role === 'ADMIN' ? (
              <Navigate to="/accountant/production-view" />
            ) : currentUser.role === 'OPERATOR' ? (
              <Navigate to={`/supervisor/${currentUser.factory.toLowerCase()}/production-view`} />
            ) : (
              <Navigate to="/login" />
            )
          ) : (
            <LoginPage onLogin={handleLogin} />
          )} 
        />
        
        {/* Boss Routes */}
        <Route 
          path="/boss/dashboard" 
          element={
            <BossRoute>
              <BossLayout user={currentUser} onLogout={handleLogout}>
                <BossDashboard user={currentUser} onLogout={handleLogout} />
              </BossLayout>
            </BossRoute>
          } 
        />
        <Route 
          path="/boss/client-management" 
          element={
            <BossRoute>
              <BossLayout user={currentUser} onLogout={handleLogout}>
                <ClientManagement user={currentUser} onLogout={handleLogout} />
              </BossLayout>
            </BossRoute>
          } 
        />
        <Route 
          path="/boss/project-management" 
          element={
            <BossRoute>
              <BossLayout user={currentUser} onLogout={handleLogout}>
                <ProjectManagement user={currentUser} onLogout={handleLogout} />
              </BossLayout>
            </BossRoute>
          } 
        />
        <Route 
          path="/boss/production-overview" 
          element={
            <BossRoute>
              <BossLayout user={currentUser} onLogout={handleLogout}>
                <SharedProductionView user={currentUser} onLogout={handleLogout} />
              </BossLayout>
            </BossRoute>
          } 
        />
        {/* Accountant Routes */}
        <Route 
          path="/accountant/production-view" 
          element={
            <AccountantRoute>
              <AccountantLayout user={currentUser} onLogout={handleLogout}>
                <SharedProductionView user={currentUser} onLogout={handleLogout} />
              </AccountantLayout>
            </AccountantRoute>
          } 
        />
        <Route 
          path="/accountant/project-management" 
          element={
            <AccountantRoute>
              <AccountantLayout user={currentUser} onLogout={handleLogout}>
                <AccountantProjectManagement user={currentUser} onLogout={handleLogout} />
              </AccountantLayout>
            </AccountantRoute>
          } 
        />
        <Route 
          path="/accountant/client-management" 
          element={
            <AccountantRoute>
              <AccountantLayout user={currentUser} onLogout={handleLogout}>
                <AccountantClientManagement user={currentUser} onLogout={handleLogout} />
              </AccountantLayout>
            </AccountantRoute>
          } 
        />
        {/* Accountant Client and Project View Routes */}
        <Route 
          path="/accountant/clients" 
          element={
            <AccountantRoute>
              <AccountantLayout user={currentUser} onLogout={handleLogout}>
                <AccountantClientManagement user={currentUser} onLogout={handleLogout} />
              </AccountantLayout>
            </AccountantRoute>
          } 
        />
        <Route 
          path="/accountant/projects" 
          element={
            <AccountantRoute>
              <AccountantLayout user={currentUser} onLogout={handleLogout}>
                <AccountantProjectManagement user={currentUser} onLogout={handleLogout} />
              </AccountantLayout>
            </AccountantRoute>
          } 
        />
        
        {/* Supervisor Routes - Mahape */}
        <Route 
          path="/supervisor/mahape/clients" 
          element={
            <SupervisorRoute requiredFactory="Mahape">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ClientList user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        <Route 
          path="/supervisor/mahape/client-details/:clientId" 
          element={
            <SupervisorRoute requiredFactory="Mahape">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ClientDetails user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        <Route 
          path="/supervisor/mahape/projects" 
          element={
            <SupervisorRoute requiredFactory="Mahape">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ProjectList user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        
        
        {/* Supervisor Production View - Mahape */}
        <Route 
          path="/supervisor/mahape/production-view" 
          element={
            <SupervisorRoute requiredFactory="Mahape">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <SharedProductionView user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        
        {/* Supervisor Routes - Taloja */}
        <Route 
          path="/supervisor/taloja/clients" 
          element={
            <SupervisorRoute requiredFactory="Taloja">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ClientList user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        <Route 
          path="/supervisor/taloja/client-details/:clientId" 
          element={
            <SupervisorRoute requiredFactory="Taloja">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ClientDetails user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        <Route 
          path="/supervisor/taloja/projects" 
          element={
            <SupervisorRoute requiredFactory="Taloja">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <ProjectList user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        
        
        {/* Supervisor Production View - Taloja */}
        <Route 
          path="/supervisor/taloja/production-view" 
          element={
            <SupervisorRoute requiredFactory="Taloja">
              <SupervisorLayout user={currentUser} onLogout={handleLogout}>
                <SharedProductionView user={currentUser} onLogout={handleLogout} />
              </SupervisorLayout>
            </SupervisorRoute>
          } 
        />
        

      </Routes>
    </div>
  )
}

export default App