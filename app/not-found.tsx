import React from 'react';
import '@/styles/globals.css';
export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center font-system">
      <div className="flex items-center">
        <div className="border-r border-gray-300 pr-5 mr-5">
          <h1 className="text-2xl font-medium text-gray-900">404</h1>
        </div>
        <div>
          <h2 className="text-sm text-gray-600">
            This page could not be found
          </h2>
        </div>
      </div>
    </div>
  );
}
