'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ProductWithAssets, ProductCategory, PRODUCT_CATEGORIES } from '@/types/product'
import ProductCard from '@/components/ProductCard'

interface FilterState {
  category: ProductCategory | 'all'
  status: 'draft' | 'in_review' | 'approved' | 'archived' | 'all'
  search: string
}

export default function Home() {
  const [products, setProducts] = useState<ProductWithAssets[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductWithAssets[]>([])
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    status: 'all',
    search: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0)

  // Fetch products from Supabase
  useEffect(() => {
    fetchProducts()
  }, [])

  // Apply filters whenever filters or products change
  useEffect(() => {
    applyFilters()
  }, [filters, products])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      
      // First get all products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error fetching products:', productsError)
        return
      }

      // Then get asset counts for each product and sample assets for thumbnails
      const productsWithAssets = await Promise.all(
        (productsData || []).map(async (product) => {
          // Get asset count
          const { count } = await supabase
            .from('assets')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product.id)

          // Get first few assets for thumbnails
          const { data: assets } = await supabase
            .from('assets')
            .select('id, filename, file_url, filetype, status')
            .eq('product_id', product.id)
            .order('created_at', { ascending: false })
            .limit(3)

          return {
            ...product,
            asset_count: count || 0,
            assets: assets || []
          }
        })
      )

      // Get total asset count across all products
      const { count: totalAssetCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })

      setProducts(productsWithAssets)
      setTotalAssets(totalAssetCount || 0)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(product => product.status === filters.status)
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredProducts(filtered)
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
                href="/product/new"
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
                New Product
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Total Products - Shows all products */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
            </div>
          </button>
          
          {/* Approved Products - Filters to approved status */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'approved', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved Products</div>
              </div>
            </div>
          </button>
          
          {/* Total Assets - Shows all products (since assets are within products) */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalAssets}</div>
                <div className="text-sm text-gray-600">Total Assets</div>
                <div className="text-xs text-gray-500 mt-1">Click to view all products</div>
              </div>
            </div>
          </button>
          
          {/* Categories - Shows category breakdown */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 relative group">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(PRODUCT_CATEGORIES).length}
                </div>
                <div className="text-sm text-gray-600">Categories</div>
                <div className="text-xs text-gray-500 mt-1">Click category below</div>
              </div>
            </div>
            
            {/* Category dropdown on hover */}
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2">
                {Object.entries(PRODUCT_CATEGORIES).map(([key, config]) => {
                  const categoryCount = products.filter(p => p.category === key).length
                  return (
                    <button
                      key={key}
                      onClick={() => setFilters({ category: key as ProductCategory, status: 'all', search: '' })}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <span className="text-lg mr-2">{config.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{config.label}</span>
                      </span>
                      <span className="text-sm text-gray-500">{categoryCount}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Draft Products */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'draft', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {products.filter(p => p.status === 'draft').length}
                </div>
                <div className="text-sm text-gray-600">📝 Draft</div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📝</span>
              </div>
            </div>
          </button>

          {/* In Review Products */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'in_review', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {products.filter(p => p.status === 'in_review').length}
                </div>
                <div className="text-sm text-gray-600">🔍 In Review</div>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔍</span>
              </div>
            </div>
          </button>

          {/* Approved Products */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'approved', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {products.filter(p => p.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">✅ Approved</div>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
            </div>
          </button>

          {/* Archived Products */}
          <button
            onClick={() => setFilters({ category: 'all', status: 'archived', search: '' })}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200 hover:bg-white/80 hover:shadow-lg transform hover:scale-105 transition-all duration-200 text-left w-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {products.filter(p => p.status === 'archived').length}
                </div>
                <div className="text-sm text-gray-600">📦 Archived</div>
              </div>
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as ProductCategory | 'all' }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">📝 Draft</option>
                  <option value="in_review">🔍 In Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="archived">📦 Archived</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search products..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredProducts.length} Products
              {filters.status !== 'all' || filters.category !== 'all' || filters.search ? ' (filtered)' : ''}
            </h2>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first product</p>
            <Link
              href="/product/new"
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
              Create First Product
            </Link>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && products.length > 0 && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => setFilters({ category: 'all', status: 'all', search: '' })}
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

        {/* Products Grid */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
