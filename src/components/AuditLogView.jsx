import { useState } from 'react'

// Empty data structure to replace mock data
const mockAuditLogs = []

export default function AuditLogView() {
  const [dateFilter, setDateFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filteredLogs = mockAuditLogs.filter(log => {
    return (
      (dateFilter === '' || log.timestamp.includes(dateFilter)) &&
      (userFilter === '' || log.user.toLowerCase().includes(userFilter.toLowerCase())) &&
      (actionFilter === '' || log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    )
  })

  return (
    <div>
      <div className="card mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Audit Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">User</label>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by user"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Action</label>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => {
                setDateFilter('')
                setUserFilter('')
                setActionFilter('')
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-head">
              <tr>
                <th className="table-header">Timestamp</th>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Action</th>
                <th className="table-header">Details</th>
                <th className="table-header">IP Address</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="table-row">
                    <td className="table-cell">{log.timestamp}</td>
                    <td className="table-cell font-medium">{log.user}</td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {log.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell">{log.details}</td>
                    <td className="table-cell">{log.ip}</td>
                  </tr>
                ))
              ) : (
                <tr className="table-row">
                  <td colSpan="6" className="table-cell text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900">No audit logs found</h3>
                      <p className="mt-1 text-gray-500">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {filteredLogs.length} of {mockAuditLogs.length} entries
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-secondary">Previous</button>
            <button className="btn btn-primary">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}