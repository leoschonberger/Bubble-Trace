'use client';

import { ParentRequirement } from '@/types';

interface FilterPanelProps {
  parentRequirements: ParentRequirement[];
  filters: {
    parentFilter: string;
    statusFilter: string;
  };
  onFiltersChange: (filters: { parentFilter: string; statusFilter: string }) => void;
}

export default function FilterPanel({ 
  parentRequirements, 
  filters, 
  onFiltersChange 
}: FilterPanelProps) {
  const handleParentFilterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      parentFilter: value
    });
  };

  const handleStatusFilterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      statusFilter: value
    });
  };

  return (
    <div className="bg-white border-2 border-gray-900 p-4 mb-6 font-mono">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
            🎯 PARENT REQ
          </label>
          <select
            value={filters.parentFilter}
            onChange={(e) => handleParentFilterChange(e.target.value)}
            className="px-3 py-2 border-2 border-gray-900 bg-white focus:outline-none focus:border-orange-500 text-xs font-medium text-gray-600"
          >
            <option value="">All Parent Requirements</option>
            {parentRequirements.map((parent) => (
              <option key={parent.id} value={parent.name}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
            🧪 TEST STATUS
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="px-3 py-2 border-2 border-gray-900 bg-white focus:outline-none focus:border-teal-400 text-xs font-medium text-gray-600"
          >
            <option value="">All Statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
            🔍 SEARCH
          </label>
          <input
            type="text"
            placeholder="TYPE NAME..."
            value={filters.parentFilter}
            onChange={(e) => handleParentFilterChange(e.target.value)}
            className="px-3 py-2 border-2 border-gray-900 bg-white focus:outline-none focus:border-yellow-400 text-xs font-medium text-gray-600 placeholder:text-gray-500 placeholder:uppercase"
          />
        </div>

        {(filters.parentFilter || filters.statusFilter) && (
          <button
            onClick={() => onFiltersChange({ parentFilter: '', statusFilter: '' })}
            className="px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all self-end text-xs font-bold uppercase tracking-wider"
          >
            ✗ CLEAR
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-orange-500 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">🎯 PARENT</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-teal-400 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">📋 CHILD</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-teal-400 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">✓ PASSED</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-red-500 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">✗ FAILED</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-yellow-400 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">● PENDING</span>
        </div>
      </div>
    </div>
  );
}