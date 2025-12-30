
import React from 'react';

interface VelocityLogoProps {
  className?: string;
}

export const VelocityLogo: React.FC<VelocityLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Abstract Ribbon/Knot 'V' Shape */}
      <path 
        d="M20 20C20 20 45 20 55 45C65 70 80 80 80 80" 
        stroke="currentColor" 
        strokeWidth="12" 
        strokeLinecap="round" 
        fill="none" 
        className="opacity-50"
      />
      <path 
        d="M80 20C80 20 55 20 45 45C35 70 20 80 20 80" 
        stroke="currentColor" 
        strokeWidth="12" 
        strokeLinecap="round" 
        fill="none" 
      />
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="opacity-20" />
    </svg>
  );
};
