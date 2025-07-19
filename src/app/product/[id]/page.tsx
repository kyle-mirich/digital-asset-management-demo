'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Product, PRODUCT_STATUS_CONFIG, PRODUCT_CATEGORIES, ProductStatus, PRODUCT_STATUS_TRANSITIONS } from '@/types/product'
import { Asset } from '@/types/asset'
import AssetCard from '@/components/AssetCard'
import ProductChecklist from '@/components/ProductChecklist'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  const handleProductStatusChange = async (newStatus: ProductStatus) => {
    if (!product) return
    
    setIsUpdatingStatus(true)
    try {
      console.log(`Updating product ${product.id} from ${product.status} to ${newStatus}`)
      
      const { data, error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', product.id)
        .select()
        .single()

      if (error) {
        console.error('Supabase error updating product status:', error)
        alert(`Failed to update product status: ${error.message}`)
        return
      }

      console.log('Product status updated successfully:', data)
      setProduct(data)
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating product status:', error)
      alert(`Failed to update product status: ${error}`)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return
    
    setIsDeleting(true)
    try {
      // First, get all assets associated with this product to delete their files
      const { data: productAssets, error: assetsError } = await supabase
        .from('assets')
        .select('file_url')
        .eq('product_id', product.id)

      if (assetsError) {
        console.error('Error fetching product assets:', assetsError)
      } else if (productAssets) {
        // Delete files from storage
        for (const asset of productAssets) {
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
        .eq('product_id', product.id)

      if (deleteAssetsError) {
        console.error('Error deleting product assets:', deleteAssetsError)
      }

      // Delete the product
      const { error: deleteProductError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (deleteProductError) {
        console.error('Error deleting product:', deleteProductError)
        alert('Failed to delete product. Please try again.')
        return
      }

      // Redirect to home page
      router.push('/')
      
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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
              {/* Status Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdatingStatus}
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${statusConfig.color} ${statusConfig.hoverColor}
                    transition-all duration-200 cursor-pointer
                    ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isUpdatingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border border-current border-t-transparent mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      {statusConfig.label}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>

                {showStatusDropdown && !isUpdatingStatus && (
                  <div className="
                    absolute top-full left-0 mt-1 w-48
                    bg-white border border-gray-300 rounded-lg shadow-lg z-50
                  ">
                    <div className="py-1">
                      {Object.entries(PRODUCT_STATUS_CONFIG).map(([status, config]) => {
                        // For now, allow all transitions to fix any status issues
                        const canTransition = true // We'll make this more restrictive later if needed
                        
                        return (
                          <button
                            key={status}
                            onClick={() => handleProductStatusChange(status as ProductStatus)}
                            disabled={false}
                            className={`
                              w-full text-left px-4 py-2 transition-colors duration-200
                              flex items-center justify-between
                              hover:bg-gray-50 cursor-pointer
                              ${status === product.status ? 'bg-gray-100' : ''}
                            `}
                          >
                            <span className={`
                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                              ${config.color}
                            `}>
                              {config.label}
                            </span>
                            {status === product.status && (
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

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
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-gradient-to-r from-red-600 to-red-700 text-white font-medium
                  hover:from-red-700 hover:to-red-800 
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Product
              </button>
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
            {/* Product Checklist */}
            <ProductChecklist 
              productId={product.id}
              onChecklistUpdate={(completedRequired, totalRequired) => {
                // Optional: You can use this to show progress in UI or trigger actions
                console.log(`Checklist progress: ${completedRequired}/${totalRequired}`)
              }}
            />

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-full mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete <strong>{product.name}</strong>?
              </p>
              <p className="text-xs text-gray-500">
                This will permanently remove the product and all {assets.length} associated assets from your library.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2 rounded-lg
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  transition-all duration-200
                  hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="
                  flex-1 px-4 py-2 rounded-lg
                  bg-gradient-to-r from-red-600 to-red-700 text-white font-medium
                  hover:from-red-700 hover:to-red-800 
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isDeleting ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete Product'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}