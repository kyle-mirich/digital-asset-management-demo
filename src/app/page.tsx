'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Asset, FilterState } from '@/types/asset'
import AssetCard from '@/components/AssetCard'
import FilterPanel from '@/components/FilterPanel'

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [filters, setFilters] = useState<FilterState>({
    campaign: '',
    status: 'all',
    tags: [],
    search: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableCampaigns, setAvailableCampaigns] = useState<string[]>([])

  // Fetch assets from Supabase
  useEffect(() => {
    fetchAssets()
  }, [])

  // Apply filters whenever filters or assets change
  useEffect(() => {
    applyFilters()
  }, [filters, assets])

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assets:', error)
        return
      }

      setAssets(data || [])
      
      // Extract unique tags and campaigns
      const allTags = new Set<string>()
      const allCampaigns = new Set<string>()
      
      data?.forEach(asset => {
        asset.tags?.forEach((tag: string) => allTags.add(tag))
        if (asset.campaign) allCampaigns.add(asset.campaign)
      })
      
      setAvailableTags(Array.from(allTags))
      setAvailableCampaigns(Array.from(allCampaigns))
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...assets]

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(asset => asset.status === filters.status)
    }

    // Campaign filter
    if (filters.campaign) {
      filtered = filtered.filter(asset => asset.campaign === filters.campaign)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(asset => 
        filters.tags.some(tag => asset.tags?.includes(tag))
      )
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.filename.toLowerCase().includes(searchTerm) ||
        asset.notes?.toLowerCase().includes(searchTerm) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    setFilteredAssets(filtered)
  }

  const handleStatusChange = async (assetId: string, newStatus: Asset['status']) => {
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: newStatus })
        .eq('id', assetId)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? { ...asset, status: newStatus } : asset
      ))
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VuoriFlow</h1>
                <p className="text-sm text-gray-600">Digital Asset Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/upload"
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
                  hover:from-blue-700 hover:to-purple-700 
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Upload Assets
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{assets.length}</div>
                <div className="text-sm text-gray-600">Total Assets</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assets.filter(a => a.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {assets.filter(a => a.status === 'in_review').length}
                </div>
                <div className="text-sm text-gray-600">In Review</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{availableTags.length}</div>
                <div className="text-sm text-gray-600">Tags</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            availableTags={availableTags}
            availableCampaigns={availableCampaigns}
            isLoading={isLoading}
          />
        </div>

        {/* Assets Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredAssets.length} Assets
              {filters.status !== 'all' || filters.campaign || filters.tags.length > 0 || filters.search ? ' (filtered)' : ''}
            </h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && assets.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
            <p className="text-gray-500 mb-4">Get started by uploading your first asset</p>
            <Link
              href="/upload"
              className="
                inline-flex items-center px-4 py-2 rounded-lg
                bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
                hover:from-blue-700 hover:to-purple-700 
                transform hover:scale-105 transition-all duration-200
                shadow-lg hover:shadow-xl
              "
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Upload First Asset
            </Link>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && assets.length > 0 && filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => setFilters({ campaign: '', status: 'all', tags: [], search: '' })}
              className="
                inline-flex items-center px-4 py-2 rounded-lg
                bg-gray-100 text-gray-700 hover:bg-gray-200
                transition-all duration-200
              "
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Assets Grid */}
        {!isLoading && filteredAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset, index) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onStatusChange={handleStatusChange}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
