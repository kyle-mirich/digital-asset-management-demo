'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Product, PRODUCT_STATUS_CONFIG, PRODUCT_CATEGORIES } from '@/types/product'
import { Asset } from '@/types/asset'
import AssetCard from '@/components/AssetCard'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  const fetchProduct = async (productId: string) => {
    try {
      setIsLoading(true)
      
      // Fetch product details
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (productError) {
        setError('Product not found')
        return
      }

      setProduct(productData)

      // Fetch assets for this product
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (assetsError) {
        console.error('Error fetching assets:', assetsError)
      } else {
        setAssets(assetsData || [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to load product')
    } finally {
      setIsLoading(false)
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist'}</p>
          <Link
            href="/"
            className="
              inline-flex items-center px-4 py-2 rounded-lg
              bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
              hover:from-blue-700 hover:to-purple-700 
              transform hover:scale-105 transition-all duration-200
              shadow-lg hover:shadow-xl
            "
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = PRODUCT_STATUS_CONFIG[product.status] || PRODUCT_STATUS_CONFIG.draft
  const categoryConfig = PRODUCT_CATEGORIES[product.category] || PRODUCT_CATEGORIES.other

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="
                  p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg
                  transition-all duration-200
                  hover:scale-110
                "
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {categoryConfig.icon} {categoryConfig.label} • {assets.length} assets
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${statusConfig.color}
              `}>
                {statusConfig.label}
              </span>
              <Link
                href={`/product/${product.id}/upload`}
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
                Add Assets
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {categoryConfig.icon} {categoryConfig.label}
                  </p>
                </div>
                {product.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            {/* Assets Grid */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Assets ({assets.length})
                </h2>
                <Link
                  href={`/product/${product.id}/upload`}
                  className="
                    inline-flex items-center px-4 py-2 rounded-lg
                    bg-gradient-to-r from-green-600 to-green-700 text-white font-medium
                    hover:from-green-700 hover:to-green-800 
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

              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
                  <p className="text-gray-500 mb-4">Start by uploading some assets for this product</p>
                  <Link
                    href={`/product/${product.id}/upload`}
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset, index) => (
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Assets</span>
                  <span className="text-sm font-medium text-gray-900">{assets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Draft</span>
                  <span className="text-sm font-medium text-gray-900">
                    {assets.filter(a => a.status === 'draft').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Review</span>
                  <span className="text-sm font-medium text-gray-900">
                    {assets.filter(a => a.status === 'in_review').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-medium text-gray-900">
                    {assets.filter(a => a.status === 'approved').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">QC Passed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {assets.filter(a => a.qc_passed).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href={`/product/${product.id}/upload`}
                  className="
                    w-full flex items-center justify-center px-4 py-3 rounded-lg
                    bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
                    hover:from-blue-700 hover:to-purple-700 
                    transform hover:scale-105 transition-all duration-200
                    shadow-lg hover:shadow-xl
                  "
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Assets
                </Link>
                
                <Link
                  href={`/product/${product.id}/edit`}
                  className="
                    w-full flex items-center justify-center px-4 py-3 rounded-lg
                    bg-gray-100 text-gray-700 hover:bg-gray-200
                    transition-all duration-200
                    hover:scale-105
                  "
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Product
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}