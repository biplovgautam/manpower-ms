// client/src/components/ui/Card.jsx
"use client";
import React from 'react';

/**
 * Card Container
 * Updated to accept and spread all native HTML props (like onClick)
 */
export function Card({ children, className = '', onClick, ...props }) {
  return (
    <div 
      onClick={onClick}
      // If onClick exists, we add 'role="button"' for screen readers
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}
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