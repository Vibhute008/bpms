import { useState, useEffect } from 'react';
import { getFilteredActivities } from '../utils/activityLogger';

export default function ActivityLog({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const filteredActivities = getFilteredActivities(currentUser);
    setActivities(filteredActivities);
  }, [currentUser]);

  const getActionColor = (action) => {
    switch (action) {
      case 'create': 
      case 'created': 
        return 'bg-green-100 text-green-800';
      case 'update': 
      case 'updated': 
        return 'bg-blue-100 text-blue-800';
      case 'delete': 
      case 'deleted': 
        return 'bg-red-100 text-red-800';
      case 'login': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'create': 
      case 'created': 
        return 'Created';
      case 'update': 
      case 'updated': 
        return 'Updated';
      case 'delete': 
      case 'deleted': 
        return 'Deleted';
      case 'login': return 'Logged In';
      default: return action.charAt(0).toUpperCase() + action.slice(1);
    }
  };

  const getEntityTypeText = (entityType) => {
    switch (entityType) {
      case 'client': return 'Client';
      case 'project': return 'Project';
      case 'invoice': return 'Invoice';
      case 'daily_entry': return 'Daily Entry';
      case 'production entry': return 'Production Entry';
      case 'user session': return 'User Session';
      default: return entityType.charAt(0).toUpperCase() + entityType.slice(1);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.action === filter;
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
          <div className="mt-2 md:mt-0">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-select sm:text-sm"
            >
              <option value="all">All Activities</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="login">Logged In</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {filteredActivities.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
              <li key={activity.id} className="px-6 py-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activity.userRole === 'SUPER_ADMIN' ? 'bg-purple-100' : activity.userRole === 'ADMIN' ? 'bg-blue-100' : activity.userRole === 'OPERATOR' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {activity.userRole === 'SUPER_ADMIN' ? (
                        <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : activity.userRole === 'ADMIN' ? (
                        <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : activity.userRole === 'OPERATOR' ? (
                        <svg className="h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.userRole === 'SUPER_ADMIN' ? 'Boss' : activity.userRole === 'ADMIN' ? 'Accountant' : activity.userRole === 'OPERATOR' ? `Supervisor (${activity.userFactory})` : activity.userRole}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getActionText(activity.action)} {getEntityTypeText(activity.entityType)}: {activity.entityName}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                        {getActionText(activity.action)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
            <p className="mt-1 text-sm text-gray-500">There are no activities to show right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}