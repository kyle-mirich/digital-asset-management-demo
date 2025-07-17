'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { ProductWithAssets, PRODUCT_STATUS_CONFIG, PRODUCT_CATEGORIES } from '@/types/product'

interface ProductCardProps {
  product: ProductWithAssets
  onStatusChange?: (productId: string, newStatus: ProductWithAssets['status']) => void
  priority?: boolean
}

export default function ProductCard({ product, onStatusChange, priority = false }: ProductCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  
  const statusConfig = PRODUCT_STATUS_CONFIG[product.status] || PRODUCT_STATUS_CONFIG.draft
  const categoryConfig = PRODUCT_CATEGORIES[product.category] || PRODUCT_CATEGORIES.other
  
  // Get the first asset as a thumbnail, if available
  const thumbnailAsset = product.assets?.[0]
  const isImage = thumbnailAsset?.filetype.startsWith('image/')

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {thumbnailAsset && isImage ? (
          <>
            <Image
              src={thumbnailAsset.file_url}
              alt={product.name}
              fill
              className={`
                object-cover transition-all duration-500 group-hover:scale-105
                ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setIsImageLoaded(true)}
              priority={priority}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="text-4xl mb-2">{categoryConfig.icon}</div>
              <div className="text-sm text-gray-600 font-medium">{categoryConfig.label}</div>
            </div>
          </div>
        )}
        
        {/* Asset count overlay */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
          {product.asset_count} {product.asset_count === 1 ? 'asset' : 'assets'}
        </div>
        
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-white/90 text-gray-700">
            <span className="mr-1">{categoryConfig.icon}</span>
            {categoryConfig.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          <div className="ml-3">
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
              ${statusConfig.color}
            `}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>
            Created {formatDistanceToNow(new Date(product.created_at), { addSuffix: true })}
          </span>
          <span>
            Updated {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Link
            href={`/product/${product.id}`}
            className="
              flex-1 text-center px-4 py-2 rounded-lg
              bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
              hover:from-blue-700 hover:to-purple-700 
              transform hover:scale-105 transition-all duration-200
              shadow-lg hover:shadow-xl
            "
          >
            View Product
          </Link>
          <Link
            href={`/product/${product.id}/upload`}
            className="
              px-4 py-2 rounded-lg
              bg-gray-100 text-gray-700 hover:bg-gray-200
              transition-all duration-200
              hover:scale-105
            "
            title="Add Assets"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}