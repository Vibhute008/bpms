import { useState, useEffect } from 'react'
import Toast from './Toast'

let toastCounter = 0

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = toastCounter++
    const newToast = { id, message, type, duration }
    
    setToasts(prevToasts => [...prevToasts, newToast])
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }

  // Make addToast globally accessible
  useEffect(() => {
    window.addToast = addToast
    return () => {
      delete window.addToast
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  )
}