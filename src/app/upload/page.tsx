'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadForm from '@/components/UploadForm'

export default function UploadPage() {
  const router = useRouter()
  const [uploadedAssets, setUploadedAssets] = useState<string[]>([])

  const handleUploadComplete = (assetId: string) => {
    setUploadedAssets(prev => [...prev, assetId])
    
    // Auto-redirect to the asset detail page after successful upload
    setTimeout(() => {
      router.push(`/asset/${assetId}`)
    }, 1000)
  }

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
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Upload Assets</h1>
                  <p className="text-sm text-gray-600">Add new digital assets to VuoriFlow</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {uploadedAssets.length > 0 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {uploadedAssets.length} uploaded
                  </span>
                )}
              </div>
              <Link
                href="/"
                className="
                  inline-flex items-center px-4 py-2 rounded-lg
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  transition-all duration-200
                  hover:scale-105
                "
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                View All Assets
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
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Assets
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Drag and drop your images and videos, or click to select files. 
            Add metadata, tags, and organize your digital assets efficiently.
          </p>
        </div>

        {/* Upload Form */}
        <div className="mb-12">
          <UploadForm onUploadComplete={handleUploadComplete} />
        </div>

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

          {/* Workflow Info */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Asset Workflow</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <span className="text-sm font-medium text-gray-600">1</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Draft</p>
                  <p className="text-xs text-gray-500">Initial upload</p>
                </div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
                  <span className="text-sm font-medium text-yellow-600">2</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Review</p>
                  <p className="text-xs text-gray-500">QC & validation</p>
                </div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <span className="text-sm font-medium text-green-600">3</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Approved</p>
                  <p className="text-xs text-gray-500">Ready for use</p>
                </div>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200 rounded-full">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full">
                  <span className="text-sm font-medium text-slate-600">4</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Archived</p>
                  <p className="text-xs text-gray-500">Long-term storage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {uploadedAssets.length > 0 && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl">
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
                  Your assets are now available in the asset library and ready for review.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}