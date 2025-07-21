'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Asset, GenderCategory } from '@/types/asset'

interface AssetWithProduct extends Asset {
  product?: {
    id: string
    name: string
    category: string
  }
}

interface FilterState {
  status: 'draft' | 'in_review' | 'approved' | 'archived' | 'all'
  search: string
  fileType: 'image' | 'video' | 'all'
  gender_category: GenderCategory | 'all'
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetWithProduct[]>([])
  const [filteredAssets, setFilteredAssets] = useState<AssetWithProduct[]>([])
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    search: '',
    fileType: 'all',
    gender_category: 'all'
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setIsLoading(true)
      
      const { data: assetsData, error } = await supabase
        .from('assets')
        .select(`
          *,
          product:products (
            id,
            name,
            category
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assets:', error)
        return
      }

      setAssets(assetsData || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...assets]

    if (filters.status !== 'all') {
      filtered = filtered.filter(asset => asset.status === filters.status)
    }

    if (filters.fileType !== 'all') {
      filtered = filtered.filter(asset => 
        filters.fileType === 'image' 
          ? asset.filetype.startsWith('image/')
          : asset.filetype.startsWith('video/')
      )
    }

    if (filters.gender_category !== 'all') {
      filtered = filtered.filter(asset => asset.gender_category === filters.gender_category)
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.filename.toLowerCase().includes(searchTerm) ||
        asset.product?.name.toLowerCase().includes(searchTerm) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    setFilteredAssets(filtered)
  }, [assets, filters])

  useEffect(() => {
    applyFilters()
  }, [filters, assets, applyFilters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Assets</h1>
                <p className="text-sm text-gray-600">Digital Asset Library</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Products
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="text-2xl font-bold text-blue-600">{assets.length}</div>
            <div className="text-sm text-gray-600">Total Assets</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="text-2xl font-bold text-green-600">
              {assets.filter(a => a.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="text-2xl font-bold text-purple-600">
              {assets.filter(a => a.filetype.startsWith('image/')).length}
            </div>
            <div className="text-sm text-gray-600">Images</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
            <div className="text-2xl font-bold text-orange-600">
              {assets.filter(a => a.filetype.startsWith('video/')).length}
            </div>
            <div className="text-sm text-gray-600">Videos</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search assets, products, tags..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.status === 'all' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'approved' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.status === 'approved' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'in_review' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.status === 'in_review' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Review
              </button>
            </div>

            {/* File Type Filter */}
            <select
              value={filters.fileType}
              onChange={(e) => setFilters(prev => ({ ...prev, fileType: e.target.value as 'image' | 'video' | 'all' }))}
              className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>

            {/* Gender Filter */}
            <select
              value={filters.gender_category}
              onChange={(e) => setFilters(prev => ({ ...prev, gender_category: e.target.value as GenderCategory | 'all' }))}
              className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 min-w-[120px]"
            >
              <option value="all">All Genders</option>
              <option value="mens">Men&apos;s</option>
              <option value="womens">Women&apos;s</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {filteredAssets.length} Assets
            {filters.status !== 'all' || filters.search || filters.fileType !== 'all' ? ' (filtered)' : ''}
          </h2>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Assets Grid */}
        {!isLoading && filteredAssets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <Link
                key={asset.id}
                href={`/asset/${asset.id}`}
                className="group bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {asset.filetype.startsWith('image/') ? (
                    <Image
                      src={asset.file_url}
                      alt={asset.filename}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className="text-sm font-medium text-purple-600">Video</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                    {asset.filename}
                  </h3>
                  
                  {asset.product && (
                    <p className="text-sm text-gray-600 mt-1">
                      Product: {asset.product.name}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>{formatFileSize(asset.filesize)}</span>
                    <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredAssets.length === 0 && assets.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
            <p className="text-gray-500">Assets will appear here when you add them to products</p>
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
              onClick={() => setFilters({ status: 'all', search: '', fileType: 'all', gender_category: 'all' })}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}