// client/src/components/ui/Input.jsx
"use client";
import React from 'react';

// 1. Export Input as a named function
export function Input({ label, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        {...props}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${props.className || ''}`}
      />
    </div>
  );
}

// 2. Export Textarea as a named function (This was missing!)
export function Textarea({ label, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px] ${props.className || ''}`}
      />
    </div>
  );
}