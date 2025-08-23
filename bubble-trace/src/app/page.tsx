'use client';

import { useState, useEffect } from 'react';
import D3BubbleMap from '@/components/D3BubbleMap';
import FilterPanel from '@/components/FilterPanel';
import { ParentRequirement, ChildRequirement, TestRun } from '@/types';

export default function Home() {
  const [data, setData] = useState<{
    parentRequirements: ParentRequirement[];
    childRequirements: ChildRequirement[];
    testRuns: TestRun[];
  }>({
    parentRequirements: [],
    childRequirements: [],
    testRuns: []
  });
  
  const [filters, setFilters] = useState({
    parentFilter: '',
    statusFilter: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading bubble trace map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-shrink-0 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-orange-500 mb-6 font-mono tracking-wider">
            BUBBLE TRACE - REQUIREMENTS TRACEABILITY MAP
          </h1>
          
          <FilterPanel
            parentRequirements={data.parentRequirements}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
      
      <div className="flex-1 px-6 pb-6">
        <div className="max-w-7xl mx-auto h-full">
          <D3BubbleMap
            parentRequirements={data.parentRequirements}
            childRequirements={data.childRequirements}
            testRuns={data.testRuns}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
}