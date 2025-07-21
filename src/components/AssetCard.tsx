'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Asset, STATUS_CONFIG } from '@/types/asset'
// import { formatDistanceToNow } from 'date-fns'

interface AssetCardProps {
  asset: Asset
  onStatusChange?: (assetId: string, newStatus: Asset['status']) => void
  priority?: boolean
}

export default function AssetCard({ asset, priority = false }: AssetCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // const formatFileSize = (bytes: number) => {
  //   if (bytes === 0) return '0 Bytes'
  //   const k = 1024
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB']
  //   const i = Math.floor(Math.log(bytes) / Math.log(k))
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  // }

  const isVideo = asset.filetype.startsWith('video/')
  const isImage = asset.filetype.startsWith('image/')

  const statusConfig = STATUS_CONFIG[asset.status]

  return (
    <div
      className={`
        group relative bg-white rounded-2xl shadow-sm border border-gray-200
        transition-all duration-300 ease-out
        hover:shadow-xl hover:shadow-blue-100/50
        hover:scale-[1.02] hover:-translate-y-1
        transform-gpu
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image/Video Preview */}
      <div className="relative aspect-video rounded-t-2xl overflow-hidden bg-gray-100">
        {isImage && !imageFailed && (
          <>
            <Image
              src={asset.file_url}
              alt={asset.filename}
              fill
              className={`
                object-cover transition-all duration-500
                ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}
                group-hover:scale-105
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
              priority={priority}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </>
        )}
        
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
            <div className="text-white">
              <svg className="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p className="text-sm font-medium">Video</p>
            </div>
          </div>
        )}

        {(!isImage || imageFailed) && !isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
            <div className="text-white text-center">
              <svg className="w-16 h-16 mb-2 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <p className="text-sm font-medium">File</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
            border backdrop-blur-sm
            ${statusConfig.color}
            transition-all duration-200
            ${isHovered ? 'scale-105' : ''}
          `}>
            {statusConfig.label}
          </span>
        </div>

        {/* QC Badge */}
        {asset.qc_passed && (
          <div className="absolute top-3 left-3">
            <div className="
              inline-flex items-center justify-center w-8 h-8 
              bg-green-100 rounded-full border-2 border-green-500
              transition-all duration-200
              group-hover:scale-110
            ">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className={`
          absolute inset-0 bg-black bg-opacity-40 
          flex items-center justify-center
          transition-opacity duration-300
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}>
          <Link 
            href={`/asset/${asset.id}`}
            className="
              inline-flex items-center px-4 py-2 rounded-lg
              bg-white/90 backdrop-blur-sm text-gray-900 font-medium
              hover:bg-white transition-all duration-200
              transform hover:scale-105
            "
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Filename */}
        <div>
          <h3 className="
            font-medium text-gray-900 truncate
            group-hover:text-blue-600 transition-colors duration-200
          ">
            {asset.filename}
          </h3>

        </div>

        {/* Campaign & Gender Category */}
        <div className="flex items-center justify-between">
          {asset.campaign && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {asset.campaign}
            </div>
          )}
          
          {asset.gender_category && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
              {asset.gender_category === 'mens' ? 'Men&apos;s' : asset.gender_category === 'womens' ? 'Women&apos;s' : 'Unisex'}
            </span>
          )}
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="
                  inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                  bg-blue-50 text-blue-700 border border-blue-200
                  transition-all duration-200
                  hover:bg-blue-100 hover:scale-105
                "
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="
                inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                bg-gray-100 text-gray-600
              ">
                +{asset.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Notes Preview */}
        {asset.notes && (
          <div className="text-sm text-gray-600 line-clamp-2">
            {asset.notes}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {asset.uploader_id?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="
            p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
            transition-all duration-200
            hover:scale-110
          ">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="
            p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100
            transition-all duration-200
            hover:scale-110
          ">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}