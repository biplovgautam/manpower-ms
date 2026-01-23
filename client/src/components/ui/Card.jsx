"use client";
import React from 'react';

/**
 * Card Container
 * Updated to handle Next.js Link props and accessibility
 */
export function Card({ children, className = '', onClick, ...props }) {
  return (
    <div 
      onClick={onClick}
      // If onClick is present, handle keyboard interactions for accessibility
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      // Added focus styles so keyboard users see which card is selected
      className={`bg-white rounded-xl shadow-lg border border-gray-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-6 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

// Card Title
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl font-bold text-gray-800 ${className}`}>
      {children}
    </h3>
  );
}

// Card Content
export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}