import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';
import SearchBar from './SearchBar';

const DataTable = ({ columns, data, onRowClick, searchable = false, searchKeys = [], actions, emptyMessage = 'No data found' }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Normalize columns: support both { key, label, render(row) } and { header, accessor, render(val, row) }
  const normalizedColumns = useMemo(() => {
    return columns.map(col => {
      const colKey = col.key || (typeof col.accessor === 'string' ? col.accessor : null);
      const colLabel = col.label || col.header || '';
      const sortable = col.sortable || false;

      let renderFn;
      if (col.render && col.key) {
        // Original format: render(row)
        renderFn = (row) => col.render(row);
      } else if (col.render && typeof col.accessor === 'string') {
        // TPO format: render(value, row)
        renderFn = (row) => col.render(row[col.accessor], row);
      } else if (col.render && typeof col.accessor === 'function') {
        // Recruiter format: accessor is a function
        renderFn = (row) => col.render(col.accessor(row), row);
      } else if (typeof col.accessor === 'function') {
        // accessor is a render function
        renderFn = (row) => col.accessor(row);
      } else if (col.key) {
        renderFn = (row) => row[col.key];
      } else if (typeof col.accessor === 'string') {
        renderFn = (row) => row[col.accessor];
      } else {
        renderFn = () => '';
      }

      return { key: colKey, label: colLabel, sortable, renderFn };
    });
  }, [columns]);

  const handleSort = (key) => {
    if (!key) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm || searchKeys.length === 0) return data;
    const lowercasedSearch = searchTerm.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(lowercasedSearch);
      })
    );
  }, [data, searchTerm, searchKeys]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!data || data.length === 0) {
    return <EmptyState title="No Records" description={emptyMessage} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <SearchBar 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(typeof e === 'string' ? e : e.target.value); setCurrentPage(1); }} 
            placeholder="Search records..." 
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {normalizedColumns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && <ArrowUpDown size={14} className={sortConfig.key === col.key ? 'text-indigo-600' : 'text-gray-400'} />}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  className={`hover:bg-indigo-50/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {normalizedColumns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {col.renderFn(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={normalizedColumns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-gray-500">
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between sm:flex-row flex-col gap-4">
        <span className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-800">{sortedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-semibold text-gray-800">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-semibold text-gray-800">{sortedData.length}</span> results
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
