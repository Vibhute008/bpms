// Utility functions for activity logging and synchronization

/**
 * Log an activity to localStorage
 * @param {Object} user - The user performing the action
 * @param {string} action - The action performed (create, update, delete)
 * @param {string} entityType - The type of entity (client, project, entry, etc.)
 * @param {string} entityName - The name or identifier of the entity
 * @param {Object} details - Additional details about the action
 */
export const logActivity = (user, action, entityType, entityName, details = {}) => {
  try {
    // Create activity record
    const activity = {
      id: Date.now() + Math.random(), // Unique ID
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      userFactory: user.factory || null,
      action,
      entityType,
      entityName,
      details
    };

    // Get existing activities from localStorage
    const existingActivities = getActivityLog();
    
    // Add new activity to the beginning of the array
    const updatedActivities = [activity, ...existingActivities];
    
    // Keep only the last 100 activities to prevent localStorage from growing too large
    const trimmedActivities = updatedActivities.slice(0, 100);
    
    // Save to localStorage
    localStorage.setItem('sharedActivityLog', JSON.stringify(trimmedActivities));
    
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

/**
 * Get activity log from localStorage
 * @returns {Array} Array of activity records
 */
export const getActivityLog = () => {
  try {
    const activities = localStorage.getItem('sharedActivityLog');
    return activities ? JSON.parse(activities) : [];
  } catch (error) {
    console.error('Error retrieving activity log:', error);
    return [];
  }
};

/**
 * Get activities filtered by user role
 * Boss can see all activities, others see relevant activities
 * @param {Object} currentUser - The currently logged in user
 * @returns {Array} Filtered array of activity records
 */
export const getFilteredActivities = (currentUser) => {
  const allActivities = getActivityLog();
  
  // Boss (SUPER_ADMIN) can see all activities
  if (currentUser.role === 'SUPER_ADMIN') {
    return allActivities;
  }
  
  // Accountant can see all activities except supervisor-specific ones
  if (currentUser.role === 'ADMIN') {
    return allActivities.filter(activity => 
      activity.userRole !== 'OPERATOR' || 
      activity.entityType === 'project' || 
      activity.entityType === 'client'
    );
  }
  
  // Supervisors can see their own activities and some shared activities
  if (currentUser.role === 'OPERATOR') {
    return allActivities.filter(activity => 
      activity.userId === currentUser.id ||
      activity.userRole === 'SUPER_ADMIN' ||
      (activity.userFactory === currentUser.factory && 
       (activity.entityType === 'project' || activity.entityType === 'client'))
    );
  }
  
  return [];
};

/**
 * Clear activity log
 */
export const clearActivityLog = () => {
  try {
    localStorage.removeItem('sharedActivityLog');
  } catch (error) {
    console.error('Error clearing activity log:', error);
  }
};