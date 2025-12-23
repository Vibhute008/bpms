import { useState } from 'react'

export default function useAlert() {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
    showCancel: false
  })

  const showAlert = ({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm = null,
    showCancel = false
  }) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
      showCancel
    })
  }

  const hideAlert = () => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false
    }))
  }

  return {
    alertState,
    showAlert,
    hideAlert
  }
}