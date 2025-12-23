export default function EmptyState({ title, description, icon, action, onAction }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
        {icon ? (
          icon
        ) : (
          <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            onClick={onAction}
            className="btn btn-primary"
          >
            {action}
          </button>
        </div>
      )}
    </div>
  )
}