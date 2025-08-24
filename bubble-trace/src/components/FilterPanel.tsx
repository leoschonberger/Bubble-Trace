'use client';

import { useState, useEffect } from 'react';
import { ParentRequirement, ChildRequirement } from '@/types';

interface FilterPanelProps {
  parentRequirements: ParentRequirement[];
  childRequirements: ChildRequirement[];
  filters: {
    parentFilter: number[];
    childFilter: number[];
    statusFilter: string[];
  };
  onFiltersChange: (filters: { parentFilter: number[]; childFilter: number[]; statusFilter: string[] }) => void;
}

export default function FilterPanel({ 
  parentRequirements, 
  childRequirements,
  filters, 
  onFiltersChange 
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState({ requirements: false, status: false });

  const handleRequirementToggle = (id: number, type: 'parent' | 'child') => {
    if (type === 'parent') {
      const parentId = id;
      const isCurrentlySelected = filters.parentFilter.includes(parentId);
      
      if (isCurrentlySelected) {
        // Remove parent and all its children
        const childrenIds = childRequirements
          .filter(c => c.parent_requirement_id === parentId)
          .map(c => c.id);
        
        onFiltersChange({
          parentFilter: filters.parentFilter.filter(p => p !== parentId),
          childFilter: filters.childFilter.filter(c => !childrenIds.includes(c)),
          statusFilter: filters.statusFilter
        });
      } else {
        // Add parent and all its children
        const childrenIds = childRequirements
          .filter(c => c.parent_requirement_id === parentId)
          .map(c => c.id)
          .filter(c => !filters.childFilter.includes(c));
        
        onFiltersChange({
          parentFilter: [...filters.parentFilter, parentId],
          childFilter: [...filters.childFilter, ...childrenIds],
          statusFilter: filters.statusFilter
        });
      }
    } else {
      // Toggle individual child
      const childId = id;
      const isCurrentlySelected = filters.childFilter.includes(childId);
      
      if (isCurrentlySelected) {
        onFiltersChange({
          ...filters,
          childFilter: filters.childFilter.filter(c => c !== childId)
        });
      } else {
        onFiltersChange({
          ...filters,
          childFilter: [...filters.childFilter, childId]
        });
      }
    }
  };

  const handleStatusToggle = (status: string) => {
    const isCurrentlySelected = filters.statusFilter.includes(status);
    
    if (isCurrentlySelected) {
      onFiltersChange({
        ...filters,
        statusFilter: filters.statusFilter.filter(s => s !== status)
      });
    } else {
      onFiltersChange({
        ...filters,
        statusFilter: [...filters.statusFilter, status]
      });
    }
  };

  const RequirementDropdown = () => (
    <div className="flex flex-col relative">
      <label className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
        🎯 REQUIREMENTS
      </label>
      <button
        onClick={() => setIsOpen(prev => ({ ...prev, requirements: !prev.requirements }))}
        className="px-3 py-2 border-2 border-gray-900 bg-white hover:border-orange-500 text-xs font-medium text-gray-600 text-left flex items-center justify-between min-w-48"
      >
        <span>
          {filters.parentFilter.length + filters.childFilter.length === 0 
            ? 'Select Requirements...' 
            : `${filters.parentFilter.length + filters.childFilter.length} selected`
          }
        </span>
        <span className={`transform transition-transform ${isOpen.requirements ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen.requirements && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-gray-900 bg-white z-10 max-h-48 overflow-y-auto">
          {parentRequirements.map((parent) => {
            const children = childRequirements.filter(c => c.parent_requirement_id === parent.id);
            const isParentSelected = filters.parentFilter.includes(parent.id);
            
            return (
              <div key={parent.id}>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    id={`parent-${parent.id}`}
                    checked={isParentSelected}
                    onChange={() => handleRequirementToggle(parent.id, 'parent')}
                    className="w-3 h-3 accent-orange-500"
                  />
                  <label 
                    htmlFor={`parent-${parent.id}`}
                    className="text-xs cursor-pointer text-gray-700 font-semibold"
                  >
                    {parent.name}
                  </label>
                </div>
                
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-2 px-6 py-1 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`child-${child.id}`}
                      checked={filters.childFilter.includes(child.id)}
                      onChange={() => handleRequirementToggle(child.id, 'child')}
                      className="w-3 h-3 accent-orange-500"
                    />
                    <label 
                      htmlFor={`child-${child.id}`}
                      className="text-xs cursor-pointer text-purple-600"
                    >
                      ├─ {child.name}
                    </label>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const StatusDropdown = () => (
    <div className="flex flex-col relative">
      <label className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">
        🧪 TEST STATUS
      </label>
      <button
        onClick={() => setIsOpen(prev => ({ ...prev, status: !prev.status }))}
        className="px-3 py-2 border-2 border-gray-900 bg-white hover:border-teal-400 text-xs font-medium text-gray-600 text-left flex items-center justify-between min-w-48"
      >
        <span>
          {filters.statusFilter.length === 0 
            ? 'Select Status...' 
            : `${filters.statusFilter.length} selected`
          }
        </span>
        <span className={`transform transition-transform ${isOpen.status ? 'rotate-180' : ''}`}>▼</span>
      </button>
      
      {isOpen.status && (
        <div className="absolute top-full left-0 right-0 mt-1 border-2 border-gray-900 bg-white z-10">
          {[
            { id: 'passed', name: 'Passed' },
            { id: 'failed', name: 'Failed' },
            { id: 'pending', name: 'Pending' }
          ].map((status) => (
            <div key={status.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
              <input
                type="checkbox"
                id={`status-${status.id}`}
                checked={filters.statusFilter.includes(status.id)}
                onChange={() => handleStatusToggle(status.id)}
                className="w-3 h-3 accent-orange-500"
              />
              <label 
                htmlFor={`status-${status.id}`}
                className="text-xs cursor-pointer text-gray-700"
              >
                {status.name}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsOpen({ requirements: false, status: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white border-2 border-gray-900 p-4 mb-6 font-mono">
      <div className="flex flex-wrap gap-4 items-start dropdown-container">
        <RequirementDropdown />
        <StatusDropdown />

        {(filters.parentFilter.length > 0 || filters.childFilter.length > 0 || filters.statusFilter.length > 0) && (
          <button
            onClick={() => onFiltersChange({ parentFilter: [], childFilter: [], statusFilter: [] })}
            className="px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all self-start text-xs font-bold uppercase tracking-wider"
          >
            ✗ CLEAR ALL
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-orange-500 border border-gray-900"></div>
          <span className="font-medium uppercase text-gray-600">🎯 PARENT</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 bg-purple-500 border border-gray-900"></div>
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