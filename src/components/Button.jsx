import { forwardRef, useState, useCallback } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconPosition = 'left', 
  loading = false, 
  disabled = false, 
  className = '', 
  onClick,
  type = 'button',
  fullWidth = false,
  showProgress = false,
  progress = 0,
  ariaLabel,
  ariaDescribedBy,
  ...props 
}, ref) => {
  // Base button classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md active:translate-y-0',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 border border-gray-300 shadow-sm hover:shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 border border-transparent hover:border-gray-200',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-800 focus:ring-indigo-500 underline hover:no-underline'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  };
  
  // Width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Combine all classes
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;
  
  // Handle click with loading state
  const handleClick = (e) => {
    if (!loading && !disabled && onClick) {
      onClick(e);
    }
  };
  
  // Ripple effect handler
  const [ripples, setRipples] = useState([]);
  const addRipple = useCallback((event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);
  
  // Render icon
  const renderIcon = () => {
    if (loading) {
      return (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    return icon;
  };
  
  return (
    <button
      ref={ref}
      type={type}
      className={`${classes} relative overflow-hidden`}
      disabled={disabled || loading}
      onClick={(e) => {
        addRipple(e);
        handleClick(e);
      }}
      onKeyDown={(e) => {
        // Allow space and enter keys to trigger button
        if ((e.key === ' ' || e.key === 'Enter') && !disabled && !loading) {
          e.preventDefault();
          if (onClick) onClick(e);
        }
      }}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-busy={loading}
      aria-disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-30 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '0.6s'
          }}
        />
      ))}
      
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 bg-opacity-50">
          <div 
            className="h-full bg-current bg-opacity-30 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;