import { useEffect } from 'react'

export default function CustomAlert({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  confirmText = 'OK', 
  cancelText = 'Cancel',
  onConfirm,
  showCancel = false,
  autoClose = false,
  autoCloseDelay = 3000
}) {
  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200',
          icon: 'text-green-400',
          title: 'text-green-800',
          message: 'text-green-700',
          button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        }
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        }
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200',
          icon: 'text-amber-400',
          title: 'text-amber-800',
          message: 'text-amber-700',
          button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        }
      default: // info
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500'
        }
    }
  }

  const styles = getTypeStyles()

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default: // info
        return (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-l-4 ${styles.container}`}>
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-white sm:mx-0 sm:h-10 sm:w-10 ${styles.icon}`}>
                {getIcon()}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className={`text-lg leading-6 font-medium ${styles.title}`}>
                  {title}
                </h3>
                <div className="mt-2">
                  <p className={`text-sm ${styles.message}`}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${styles.button} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={() => {
                if (onConfirm) onConfirm()
                onClose()
              }}
            >
              {confirmText}
            </button>
            {showCancel && (
              <button
                type="button"
                className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium ${styles.cancelButton} focus:outline-none focus:ring-2 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm`}
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}