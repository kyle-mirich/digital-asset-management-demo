'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ProductWithAssets, ProductCategory, ProductGender, PRODUCT_CATEGORIES, PRODUCT_GENDERS } from '@/types/product'
import ProductCard from '@/components/ProductCard'

interface FilterState {
  category: ProductCategory | 'all'
  gender: ProductGender | 'all'
  status: 'draft' | 'in_review' | 'approved' | 'archived' | 'all'
  search: string
}

export default function Home() {
  const [products, setProducts] = useState<ProductWithAssets[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductWithAssets[]>([])
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    gender: 'all',
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

    // Gender filter
    if (filters.gender !== 'all') {
      filtered = filtered.filter(product => product.gender === filters.gender)
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
        product.category.toLowerCase().includes(searchTerm) ||
        product.gender.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredProducts(filtered)
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      // First, get all assets associated with this product to delete their files
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('file_url')
        .eq('product_id', productId)

      if (assetsError) {
        console.error('Error fetching product assets:', assetsError)
      } else if (assets) {
        // Delete files from storage
        for (const asset of assets) {
          const fileName = asset.file_url.split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('assets')
              .remove([fileName])
          }
        }
      }

      // Delete all assets associated with the product
      const { error: deleteAssetsError } = await supabase
        .from('assets')
        .delete()
        .eq('product_id', productId)

      if (deleteAssetsError) {
        console.error('Error deleting product assets:', deleteAssetsError)
      }

      // Delete the product
      const { error: deleteProductError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (deleteProductError) {
        console.error('Error deleting product:', deleteProductError)
        alert('Failed to delete product. Please try again.')
        return
      }

      // Remove from local state
      setProducts(prev => prev.filter(p => p.id !== productId))
      
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ zoom: '0.9' }}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
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
        {/* Overview Stats - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setFilters({ category: 'all', gender: 'all', status: 'all', search: '' })}
            className="group bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 text-left w-full relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{products.length}</div>
                <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">All Products</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <button
            onClick={() => setFilters({ category: 'all', status: 'approved', search: '' })}
            className="group bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 text-left w-full relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xl font-bold text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  {products.filter(p => p.status === 'approved').length}
                </div>
                <div className="p-1 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-300">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Approved</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <Link
            href="/assets"
            className="group bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 hover:bg-white/90 hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 text-left w-full relative overflow-hidden block"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-300">{totalAssets}</div>
                <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">Assets</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Compact Filter Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 p-3 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search products..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* Compact Status Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  filters.status === 'all' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'draft' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  filters.status === 'draft' 
                    ? 'bg-gray-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Draft ({products.filter(p => p.status === 'draft').length})
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'in_review' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  filters.status === 'in_review' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Review ({products.filter(p => p.status === 'in_review').length})
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, status: 'approved' }))}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  filters.status === 'approved' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved ({products.filter(p => p.status === 'approved').length})
              </button>
            </div>

            {/* Compact Category Dropdown */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as ProductCategory | 'all' }))}
              className="px-2.5 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 min-w-[140px] text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Compact Gender Dropdown */}
            <select
              value={filters.gender}
              onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value as ProductGender | 'all' }))}
              className="px-2.5 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white/80 min-w-[120px] text-sm"
            >
              <option value="all">All Genders</option>
              {Object.entries(PRODUCT_GENDERS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredProducts.length} Products
              {filters.status !== 'all' || filters.category !== 'all' || filters.gender !== 'all' || filters.search ? ' (filtered)' : ''}
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
              onClick={() => setFilters({ category: 'all', gender: 'all', status: 'all', search: '' })}
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
