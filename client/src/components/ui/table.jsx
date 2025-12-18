import React from 'react';

export const Table = ({ children, className = "" }) => (
  <div className="w-full overflow-auto">
    <table className={`w-full caption-bottom text-sm ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = "" }) => (
  <thead className={`[&_tr]:border-b bg-gray-50/50 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = "" }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = "", onClick }) => (
  <tr
    onClick={onClick}
    className={`border-b transition-colors hover:bg-gray-50/50 ${
      onClick ? "cursor-pointer" : ""
    } ${className}`}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = "" }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-500 ${className}`}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = "" }) => (
  <td className={`p-4 align-middle ${className}`}>
    {children}
  </td>
);