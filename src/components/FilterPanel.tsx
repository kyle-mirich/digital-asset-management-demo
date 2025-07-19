'use client'

import { useState, useEffect } from 'react'
import { FilterState, AssetStatus, STATUS_CONFIG, GenderCategory } from '@/types/asset'

interface FilterPanelProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  availableTags: string[]
  availableCampaigns: string[]
  isLoading?: boolean
}

export default function FilterPanel({ 
  filters, 
  onFilterChange, 
  availableTags, 
  availableCampaigns,
  isLoading = false
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({ ...filters, search: searchValue })
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchValue])

  const handleStatusChange = (status: AssetStatus | 'all') => {
    onFilterChange({ ...filters, status })
  }

  const handleCampaignChange = (campaign: string) => {
    onFilterChange({ ...filters, campaign })
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFilterChange({ ...filters, tags: newTags })
  }

  const handleGenderChange = (gender_category: GenderCategory | 'all') => {
    onFilterChange({ ...filters, gender_category })
  }

  const clearFilters = () => {
    setSearchValue('')
    onFilterChange({
      campaign: '',
      status: 'all',
      tags: [],
      search: '',
      gender_category: 'all'
    })
  }

  const hasActiveFilters = filters.campaign || filters.status !== 'all' || filters.tags.length > 0 || filters.search || (filters.gender_category && filters.gender_category !== 'all')

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <p className="text-sm text-gray-500">Refine your search results</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="
                  px-3 py-1 text-sm text-gray-600 hover:text-gray-800
                  bg-gray-100 hover:bg-gray-200 rounded-lg
                  transition-all duration-200
                  hover:scale-105
                "
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="
                p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg
                transition-all duration-200
                hover:scale-105
              "
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search assets..."
            className="
              w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
            "
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Filters */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        overflow-hidden
      `}>
        <div className="px-6 py-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusChange('all')}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium
                  transition-all duration-200
                  hover:scale-105
                  ${filters.status === 'all' 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                All
              </button>
              {(Object.keys(STATUS_CONFIG) as AssetStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                    ${filters.status === status 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : `${STATUS_CONFIG[status].color} ${STATUS_CONFIG[status].hoverColor}`
                    }
                  `}
                >
                  {STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Campaign
            </label>
            <div className="relative">
              <select
                value={filters.campaign}
                onChange={(e) => handleCampaignChange(e.target.value)}
                className="
                  w-full px-4 py-3 border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  transition-all duration-200
                  hover:border-gray-400
                  appearance-none bg-white
                "
              >
                <option value="">All Campaigns</option>
                {availableCampaigns.map(campaign => (
                  <option key={campaign} value={campaign}>
                    {campaign}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gender Category Filter */}
          {filters.gender_category !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleGenderChange('all')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                    ${(!filters.gender_category || filters.gender_category === 'all')
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  All Genders
                </button>
                <button
                  onClick={() => handleGenderChange('mens')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                    ${filters.gender_category === 'mens'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  Men's
                </button>
                <button
                  onClick={() => handleGenderChange('womens')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                    ${filters.gender_category === 'womens'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  Women's
                </button>
                <button
                  onClick={() => handleGenderChange('unisex')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    hover:scale-105
                    ${filters.gender_category === 'unisex'
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  Unisex
                </button>
              </div>
            </div>
          )}

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`
                    px-3 py-1 rounded-md text-sm font-medium border
                    transition-all duration-200
                    hover:scale-105
                    ${filters.tags.includes(tag)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
              {availableTags.length === 0 && (
                <p className="text-sm text-gray-500 italic">No tags available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <div className="flex items-center space-x-2">
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {STATUS_CONFIG[filters.status].label}
                  </span>
                )}
                {filters.campaign && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {filters.campaign}
                  </span>
                )}
                {filters.tags.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    {filters.tags.length} tag{filters.tags.length > 1 ? 's' : ''}
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    "{filters.search}"
                  </span>
                )}
                {filters.gender_category && filters.gender_category !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pink-100 text-pink-800">
                    {filters.gender_category === 'mens' ? 'Men\'s' : filters.gender_category === 'womens' ? 'Women\'s' : 'Unisex'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}