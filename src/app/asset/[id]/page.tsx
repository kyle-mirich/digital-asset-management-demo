'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Asset, STATUS_CONFIG } from '@/types/asset'
import StatusDropdown from '@/components/StatusDropdown'
import QCChecklist from '@/components/QCChecklist'
import AssetEditor from '@/components/AssetEditor'
import { formatDistanceToNow } from 'date-fns'

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQCChecklist, setShowQCChecklist] = useState(false)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchAsset(params.id as string)
    }
  }, [params.id])

  const fetchAsset = async (assetId: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single()

      if (error) {
        setError('Asset not found')
        return
      }

      setAsset(data)
    } catch (error) {
      console.error('Error fetching asset:', error)
      setError('Failed to load asset')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Asset['status']) => {
    if (!asset) return

    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: newStatus })
        .eq('id', asset.id)

      if (error) {
        console.error('Error updating status:', error)
        return
      }

      setAsset(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleQCComplete = async (passed: boolean) => {
    if (!asset) return

    try {
      const { error } = await supabase
        .from('assets')
        .update({ qc_passed: passed })
        .eq('id', asset.id)

      if (error) {
        console.error('Error updating QC status:', error)
        return
      }

      setAsset(prev => prev ? { ...prev, qc_passed: passed } : null)
      setShowQCChecklist(false)
    } catch (error) {
      console.error('Error updating QC status:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const downloadAsset = () => {
    if (asset?.file_url) {
      const link = document.createElement('a')
      link.href = asset.file_url
      link.download = asset.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleAssetUpdate = (updatedAsset: Asset) => {
    setAsset(updatedAsset)
  }

  const handleDeleteAsset = async () => {
    if (!asset) return
    
    setIsDeleting(true)
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id)

      if (dbError) {
        console.error('Error deleting asset from database:', dbError)
        return
      }

      // Delete file from storage
      const fileName = asset.file_url.split('/').pop()
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('assets')
          .remove([fileName])
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError)
        }
      }

      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error deleting asset:', error)
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
          <p className="text-lg text-gray-600">Loading asset...</p>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Asset not found</h2>
          <p className="text-gray-600 mb-4">{error || 'The asset you are looking for does not exist'}</p>
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
            Back to Assets
          </Link>
        </div>
      </div>
    )
  }

  const isImage = asset.filetype.startsWith('image/')
  const isVideo = asset.filetype.startsWith('video/')
  const statusConfig = STATUS_CONFIG[asset.status]

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
                  {asset.filename}
                </h1>
                <p className="text-sm text-gray-600">Asset Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <StatusDropdown
                currentStatus={asset.status}
                onStatusChange={handleStatusChange}
                size="md"
              />
              <button
                onClick={downloadAsset}
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-gradient-to-r from-green-600 to-green-700 text-white font-medium
                  hover:from-green-700 hover:to-green-800 
                  transform hover:scale-105 transition-all duration-200
                  shadow-lg hover:shadow-xl
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4 4V4" />
                </svg>
                Download
              </button>
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
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Preview */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {isImage && (
                  <>
                    <Image
                      src={asset.file_url}
                      alt={asset.filename}
                      fill
                      className={`
                        object-contain transition-all duration-500
                        ${isImageLoaded ? 'opacity-100' : 'opacity-0'}
                      `}
                      onLoad={() => setIsImageLoaded(true)}
                    />
                    {!isImageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                      </div>
                    )}
                  </>
                )}
                
                {isVideo && (
                  <video
                    src={asset.file_url}
                    controls
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                )}

                {!isImage && !isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                    <div className="text-white text-center">
                      <svg className="w-24 h-24 mb-4 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      <p className="text-xl font-medium">{asset.filename}</p>
                      <p className="text-sm opacity-80">{asset.filetype}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Asset Editor */}
            <AssetEditor
              asset={asset}
              onAssetUpdate={handleAssetUpdate}
              onClose={() => {}}
            />

            {/* File Info */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">File Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{asset.filetype}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{formatFileSize(asset.filesize)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {formatDistanceToNow(new Date(asset.upload_time), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    <span className={`
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      ${statusConfig.color}
                    `}>
                      {statusConfig.label}
                    </span>
                    {asset.qc_passed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        QC Passed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowQCChecklist(!showQCChecklist)}
                  className="
                    w-full flex items-center justify-center px-4 py-3 rounded-lg
                    bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium
                    hover:from-purple-700 hover:to-purple-800 
                    transform hover:scale-105 transition-all duration-200
                    shadow-lg hover:shadow-xl
                  "
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showQCChecklist ? 'Hide' : 'Show'} QC Checklist
                </button>
                
                <button
                  onClick={downloadAsset}
                  className="
                    w-full flex items-center justify-center px-4 py-3 rounded-lg
                    bg-gradient-to-r from-green-600 to-green-700 text-white font-medium
                    hover:from-green-700 hover:to-green-800 
                    transform hover:scale-105 transition-all duration-200
                    shadow-lg hover:shadow-xl
                  "
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-4 4V4" />
                  </svg>
                  Download Asset
                </button>
              </div>
            </div>

            {/* QC Checklist */}
            {showQCChecklist && (
              <div className="animate-in slide-in-from-right duration-300">
                <QCChecklist
                  assetId={asset.id}
                  onComplete={handleQCComplete}
                />
              </div>
            )}

            {/* File Details */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">File Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">File URL</span>
                  <a
                    href={asset.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    View Original
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modified</span>
                  <span className="text-sm text-gray-900">
                    {new Date(asset.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ID</span>
                  <span className="text-sm text-gray-900 font-mono">{asset.id.slice(0, 8)}...</span>
                </div>
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
                <h3 className="text-lg font-semibold text-gray-900">Delete Asset</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete <strong>{asset.filename}</strong>?
              </p>
              <p className="text-xs text-gray-500">
                This will permanently remove the asset from your library and delete the file from storage.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="
                  flex-1 px-4 py-2 rounded-lg
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  transition-all duration-200
                  hover:scale-105
                "
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
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
                  'Delete Asset'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}