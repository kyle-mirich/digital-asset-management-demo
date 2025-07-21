'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Product, PRODUCT_CATEGORIES } from '@/types/product'
import UploadForm from '@/components/UploadForm'

export default function ProductUploadPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([])

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) {
        console.error('Error fetching product:', error)
        router.push('/') // Redirect to home if product not found
        return
      }

      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id, fetchProduct])

  const handleUploadComplete = (assetId: string) => {
    setUploadedAssets(prev => [...prev, assetId])
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

  if (!product) {
    return null // Will redirect to home
  }

  const categoryConfig = PRODUCT_CATEGORIES[product.category] || PRODUCT_CATEGORIES.other

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href={`/product/${product.id}`}
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
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Upload Assets</h1>
                  <p className="text-sm text-gray-600">
                    {categoryConfig.icon} {product.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {uploadedAssets.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {uploadedAssets.length} uploaded
                </span>
              )}
              <Link
                href={`/product/${product.id}`}
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  transition-all duration-200
                  hover:scale-105
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                View Product
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <span className="text-2xl">{categoryConfig.icon}</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Add Assets to {product.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload images and videos for this {categoryConfig.label.toLowerCase()}. 
            All assets will be automatically associated with this product.
          </p>
        </div>

        {/* Product Info */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{categoryConfig.icon}</div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">{product.name}</h2>
              <p className="text-sm text-gray-600">
                {categoryConfig.label}
                {product.description && ` • ${product.description}`}
              </p>
            </div>
            <Link
              href={`/product/${product.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              View Product →
            </Link>
          </div>
        </div>

        {/* Upload Form */}
        <div className="mb-12">
          <UploadForm 
            onUploadComplete={handleUploadComplete}
            productId={product.id}
          />
        </div>

        {/* Success Message */}
        {uploadedAssets.length > 0 && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-900">
                    {uploadedAssets.length} asset{uploadedAssets.length > 1 ? 's' : ''} uploaded successfully!
                  </h3>
                  <p className="text-sm text-green-700">
                    Your assets have been added to {product.name} and are ready for review.
                  </p>
                </div>
              </div>
              <Link
                href={`/product/${product.id}`}
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-green-600 text-white font-medium
                  hover:bg-green-700
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                "
              >
                View Product
              </Link>
            </div>
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supported Formats */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Supported Formats
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">Images</p>
                  <p className="text-sm text-gray-600">JPG, PNG, GIF, WebP, SVG</p>
                  <p className="text-xs text-gray-500">Maximum size: 10MB</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Videos</p>
                  <p className="text-sm text-gray-600">MP4, MOV, AVI, WMV, FLV, WebM</p>
                  <p className="text-xs text-gray-500">Maximum size: 100MB</p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Best Practices
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Use descriptive filenames
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Add relevant tags for easy searching
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Include campaign information
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Ensure high-quality resolution
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  Compress files to reduce upload time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}