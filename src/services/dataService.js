// Data Service - Centralized data management to reduce duplication
class DataService {
  // Cache to store fetched data and reduce API calls
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Fetch data with caching
  static async fetchData(key, apiCall, useCache = true) {
    // Return cached data if available and not expired
    if (useCache && this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // In a real application, this would call an actual API
      const data = await apiCall();
      
      // Cache the data
      if (useCache) {
        this.cache.set(key, {
          data,
          timestamp: Date.now()
        });
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  // Clear cache for a specific key
  static clearCache(key) {
    this.cache.delete(key);
  }

  // Clear all cache
  static clearAllCache() {
    this.cache.clear();
  }

  // Get user-specific data
  static async getUserData(userId, userType) {
    return this.fetchData(`user_${userId}_${userType}`, () => {
      // In a real application, this would call an API endpoint
      // For now, we'll return mock data based on user type
      switch(userType) {
        case 'SUPER_ADMIN':
          return Promise.resolve({
            id: userId,
            type: 'boss',
            permissions: ['read', 'write', 'delete'],
            dashboard: {
              kpis: []
            }
          });
        
        case 'ADMIN':
          return Promise.resolve({
            id: userId,
            type: 'accountant',
            permissions: ['read', 'write'],
            dashboard: {
              kpis: []
            }
          });
        
        case 'OPERATOR':
          return Promise.resolve({
            id: userId,
            type: 'supervisor',
            permissions: ['read', 'write'],
            dashboard: {
              kpis: []
            }
          });
        
        default:
          return Promise.resolve({
            id: userId,
            type: 'guest',
            permissions: ['read']
          });
      }
    });
  }

  // Get dashboard data
  static async getDashboardData(userType) {
    return this.fetchData(`dashboard_${userType}`, () => {
      // In a real application, this would call an API endpoint
      // For now, we'll return mock data based on user type
      switch(userType) {
        case 'boss':
          return Promise.resolve({
            productionData: [],
            monthlyData: [],
            factoryData: [],
            projectStatusData: []
          });
        
        case 'accountant':
          return Promise.resolve({
            productionData: [],
            monthlyData: [],
            factoryData: [],
            projectStatusData: []
          });
        
        case 'supervisor':
          return Promise.resolve({
            productionData: [],
            monthlyData: [],
            factoryData: [],
            projectStatusData: []
          });
        
        default:
          return Promise.resolve({
            productionData: [],
            monthlyData: [],
            factoryData: [],
            projectStatusData: []
          });
      }
    });
  }

  // Get projects data
  static async getProjects(factory = null) {
    return this.fetchData(`projects_${factory || 'all'}`, () => {
      // In a real application, this would call an API endpoint
      // For now, we'll get data from localStorage
      return new Promise((resolve) => {
        try {
          let projects = [];
          const bossProjects = localStorage.getItem('bossProjects');
          if (bossProjects) {
            projects = JSON.parse(bossProjects);
          }
          
          // Get all production entries to calculate produced quantities
          let allProductionEntries = [];
          const mahapeEntries = localStorage.getItem('dailyEntries_Mahape');
          const talojaEntries = localStorage.getItem('dailyEntries_Taloja');
          
          if (mahapeEntries) {
            allProductionEntries = allProductionEntries.concat(JSON.parse(mahapeEntries));
          }
          if (talojaEntries) {
            allProductionEntries = allProductionEntries.concat(JSON.parse(talojaEntries));
          }
          
          // Calculate produced quantity for each project
          const projectsWithProgress = projects.map(project => {
            const projectEntries = allProductionEntries.filter(entry => entry.projectId === project.id);
            const totalProduced = projectEntries.reduce((sum, entry) => sum + (parseInt(entry.quantity) || 0), 0);
            
            return {
              ...project,
              produced: totalProduced
            };
          });
          
          if (factory) {
            // Filter projects for the specific factory
            resolve(projectsWithProgress.filter(project => project.factory === factory));
          } else {
            // Return all projects with calculated progress
            resolve(projectsWithProgress);
          }
        } catch (error) {
          console.error('Error calculating project progress:', error);
          resolve([]);
        }
      });
    });
  }

  // Get clients data
  static async getClients() {
    return this.fetchData('clients', () => {
      // In a real application, this would call an API endpoint
      // For now, we'll get data from localStorage
      const bossClients = localStorage.getItem('bossClients');
      return Promise.resolve(bossClients ? JSON.parse(bossClients) : []);
    });
  }

  // Get supervisor entries
  static async getSupervisorEntries() {
    return this.fetchData('supervisor_entries', () => {
      // In a real application, this would call an API endpoint
      return Promise.resolve([]);
    });
  }

  // Get all production entries
  static async getProductionEntries(factory = null) {
    return this.fetchData(`production_entries_${factory || 'all'}`, () => {
      // In a real application, this would call an API endpoint
      // For now, we'll get data from localStorage
      if (factory) {
        // Load data for a specific factory
        const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
        return Promise.resolve(factoryEntries ? JSON.parse(factoryEntries) : []);
      } else {
        // Load data from all factories
        const mahapeEntries = localStorage.getItem('dailyEntries_Mahape');
        const talojaEntries = localStorage.getItem('dailyEntries_Taloja');
        
        const mahapeData = mahapeEntries ? JSON.parse(mahapeEntries) : [];
        const talojaData = talojaEntries ? JSON.parse(talojaEntries) : [];
        
        return Promise.resolve([...mahapeData, ...talojaData]);
      }
    });
  }

  // Get a specific production entry by ID
  static async getProductionEntryById(entryId, factory) {
    return this.fetchData(`production_entry_${entryId}`, () => {
      // In a real application, this would call an API endpoint
      // For now, we'll get data from localStorage
      const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
      const entries = factoryEntries ? JSON.parse(factoryEntries) : [];
      const entry = entries.find(e => e.id === entryId);
      return Promise.resolve(entry || null);
    });
  }

  // Create a new production entry
  static async createProductionEntry(entryData, factory) {
    // In a real application, this would call an API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get existing entries
        const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
        const entries = factoryEntries ? JSON.parse(factoryEntries) : [];
        
        // Add new entry
        entries.unshift(entryData);
        
        // Save back to localStorage
        localStorage.setItem(`dailyEntries_${factory}`, JSON.stringify(entries));
        
        // Clear cache since we've added a new entry
        this.clearCache(`production_entries_${factory || 'all'}`);
        this.clearCache('production_entries_all');
        
        resolve({ success: true, message: 'Production entry created successfully', data: entryData });
      }, 500);
    });
  }

  // Update an existing production entry
  static async updateProductionEntry(entryId, entryData, factory) {
    // In a real application, this would call an API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get existing entries
        const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
        let entries = factoryEntries ? JSON.parse(factoryEntries) : [];
        
        // Find and update entry
        const index = entries.findIndex(e => e.id === entryId);
        if (index !== -1) {
          entries[index] = { ...entries[index], ...entryData };
          
          // Save back to localStorage
          localStorage.setItem(`dailyEntries_${factory}`, JSON.stringify(entries));
          
          // Clear cache since we've updated an entry
          this.clearCache(`production_entries_${factory || 'all'}`);
          this.clearCache('production_entries_all');
          this.clearCache(`production_entry_${entryId}`);
          
          resolve({ success: true, message: 'Production entry updated successfully', data: entries[index] });
        } else {
          resolve({ success: false, message: 'Production entry not found' });
        }
      }, 500);
    });
  }

  // Delete a production entry
  static async deleteProductionEntry(entryId, factory) {
    // In a real application, this would call an API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Get existing entries
        const factoryEntries = localStorage.getItem(`dailyEntries_${factory}`);
        let entries = factoryEntries ? JSON.parse(factoryEntries) : [];
        
        // Filter out the entry to delete
        const originalLength = entries.length;
        entries = entries.filter(e => e.id !== entryId);
        
        // Save back to localStorage
        localStorage.setItem(`dailyEntries_${factory}`, JSON.stringify(entries));
        
        // Clear cache since we've deleted an entry
        this.clearCache(`production_entries_${factory || 'all'}`);
        this.clearCache('production_entries_all');
        this.clearCache(`production_entry_${entryId}`);
        
        if (entries.length < originalLength) {
          resolve({ success: true, message: 'Production entry deleted successfully' });
        } else {
          resolve({ success: false, message: 'Production entry not found' });
        }
      }, 500);
    });
  }

  // Submit supervisor entry
  static async submitSupervisorEntry(entryData) {
    // In a real application, this would call an API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Clear cache for supervisor entries since we've added a new one
        this.clearCache('supervisor_entries');
        resolve({ success: true, message: 'Entry submitted successfully' });
      }, 500);
    });
  }

  // Update project progress
  static async updateProjectProgress(projectId, quantity) {
    // In a real application, this would call an API endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        // Clear cache for projects since we've updated one
        this.clearCache('projects');
        resolve({ success: true, message: 'Project progress updated' });
      }, 500);
    });
  }
}

export default DataService;