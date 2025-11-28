import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'link' | 'icon';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  icon,
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center transition-colors duration-200";
  
  const variants = {
    primary: "bg-primary hover:bg-primary-hover active:bg-primary-active text-white text-[16px] font-semibold rounded-[8px] px-6 py-4 h-[48px]",
    secondary: "bg-secondary-bg text-secondary-text hover:bg-[#E0EBFF] active:bg-[#C7DBFF] text-[15px] font-medium rounded-[8px] px-5 py-3 h-[44px]",
    link: "text-secondary-text text-[14px] font-medium hover:underline p-2",
    icon: "bg-transparent hover:bg-[#E6F0FF] rounded-full p-2 h-[40px] w-[40px] text-[#0047B3]"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};