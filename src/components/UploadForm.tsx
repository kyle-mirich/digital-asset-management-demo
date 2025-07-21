'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { AssetUpload, UploadProgress, FILE_TYPES, GenderCategory } from '@/types/asset'

interface UploadFormProps {
  onUploadComplete?: (assetId: string) => void
  productId?: string
}

interface FileWithMetadata extends UploadProgress {
  campaign: string
  tags: string
  notes: string
  gender_category: GenderCategory
}

export default function UploadForm({ onUploadComplete, productId }: UploadFormProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [pendingFiles, setPendingFiles] = useState<FileWithMetadata[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!fileExtension) {
      return { valid: false, error: 'Invalid file type' }
    }

    const isImage = (FILE_TYPES.image.extensions as readonly string[]).includes(fileExtension)
    const isVideo = (FILE_TYPES.video.extensions as readonly string[]).includes(fileExtension)

    if (!isImage && !isVideo) {
      return { valid: false, error: 'Only image and video files are allowed' }
    }

    const maxSize = isImage ? FILE_TYPES.image.maxSize : FILE_TYPES.video.maxSize
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` }
    }

    return { valid: true }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validation = validateFile(file)
      if (!validation.valid) {
        // Show error for invalid files
        alert(`Invalid file: ${file.name} - ${validation.error}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Add files to pending list with metadata forms
    const newPendingFiles = validFiles.map(file => {
      const isImage = file.type.startsWith('image/')
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined
      
      return {
        filename: file.name,
        progress: 0,
        status: 'pending' as const,
        file,
        previewUrl,
        campaign: '',
        tags: '',
        notes: '',
        gender_category: 'unisex' as GenderCategory
      }
    })

    setPendingFiles(prev => [...prev, ...newPendingFiles])
  }

  // const uploadFile = async (file: File) => {
  //   try {
  //     // Update progress to uploading
  //     setUploads(prev => prev.map(upload => 
  //       upload.filename === file.name 
  //         ? { ...upload, status: 'uploading' as const, progress: 10 }
  //         : upload
  //     ))

  //     // Generate unique filename
  //     const timestamp = Date.now()
  //     const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  //     const fileName = `${timestamp}_${cleanName}`

  //     // Upload to Supabase Storage
  //     const { data: uploadData, error: uploadError } = await supabase.storage
  //       .from('assets')
  //       .upload(fileName, file, {
  //         cacheControl: '3600',
  //         upsert: false
  //       })

  //     if (uploadError) {
  //       console.error('Upload error:', uploadError)
        
  //       // If bucket doesn't exist, try to create it
  //       if (uploadError.message?.includes('Bucket not found')) {
  //         throw new Error('Storage bucket "assets" not found. Please create it in your Supabase dashboard under Storage → Create bucket → Name: "assets" → Public: true')
  //       }
        
  //       throw new Error(uploadError.message || 'Upload failed')
  //     }



  const updateFileMetadata = (filename: string, field: keyof FileWithMetadata, value: string) => {
    setPendingFiles(prev => prev.map(file => 
      file.filename === filename 
        ? { ...file, [field]: value }
        : file
    ))
  }

  const removeFile = (filename: string) => {
    setPendingFiles(prev => prev.filter(file => file.filename !== filename))
  }

  const uploadAllFiles = async () => {
    if (pendingFiles.length === 0) return
    
    setIsUploading(true)
    
    // Move pending files to uploads with uploading status
    const uploadsToProcess = pendingFiles.map(file => ({
      ...file,
      status: 'uploading' as const,
      progress: 0
    }))
    
    setUploads(prev => [...prev, ...uploadsToProcess])
    setPendingFiles([])
    
    // Upload files concurrently
    const uploadPromises = uploadsToProcess.map(file => uploadFileWithMetadata(file))
    await Promise.all(uploadPromises)
    
    setIsUploading(false)
  }

  const uploadFileWithMetadata = async (fileData: FileWithMetadata) => {
    const { file, campaign, tags, notes, gender_category } = fileData
    if (!file) return

    try {
      // Update progress to uploading
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name 
          ? { ...upload, status: 'uploading' as const, progress: 10 }
          : upload
      ))

      // Generate unique filename
      const timestamp = Date.now()
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${cleanName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket "assets" not found. Please create it in your Supabase dashboard under Storage → Create bucket → Name: "assets" → Public: true')
        }
        
        throw new Error(uploadError.message || 'Upload failed')
      }

      // Update progress
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name 
          ? { ...upload, progress: 70, status: 'processing' as const }
          : upload
      ))

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

      // Create asset record in database
      const assetData: AssetUpload = {
        filename: file.name,
        filetype: file.type,
        filesize: file.size,
        product_id: productId || undefined,
        campaign: campaign || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        notes: notes || undefined,
        gender_category: gender_category || 'unisex'
      }

      const { data: asset, error: dbError } = await supabase
        .from('assets')
        .insert({
          ...assetData,
          file_url: publicUrl
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Update progress to complete with asset ID
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name 
          ? { ...upload, progress: 100, status: 'complete' as const, assetId: asset.id }
          : upload
      ))

      // Call completion callback
      if (onUploadComplete && asset) {
        onUploadComplete(asset.id)
      }

    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name 
          ? { ...upload, status: 'error' as const, error: errorMessage }
          : upload
      ))
    }
  }

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'complete'))
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Upload Area */}
      <div
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
          ${dragActive 
            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400'
          }
          hover:scale-[1.01] transform-gpu
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <div className="mb-4">
            <div className={`
              inline-block p-4 rounded-full transition-all duration-300
              ${dragActive ? 'bg-blue-100 scale-110' : 'bg-gray-100'}
            `}>
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {dragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to select files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              inline-flex items-center px-6 py-3 rounded-lg 
              bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
              hover:from-blue-700 hover:to-purple-700 
              transform hover:scale-105 transition-all duration-200
              shadow-lg hover:shadow-xl
            "
          >
            Choose Files
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Pending Files with Metadata Forms */}
      {pendingFiles.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Ready to Upload ({pendingFiles.length} files)
            </h3>
            <button
              onClick={uploadAllFiles}
              disabled={isUploading}
              className="
                inline-flex items-center px-6 py-3 rounded-lg
                bg-gradient-to-r from-green-600 to-green-700 text-white font-medium
                hover:from-green-700 hover:to-green-800 
                transform hover:scale-105 transition-all duration-200
                shadow-lg hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save & Upload All
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-4">
            {pendingFiles.map((file, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
              >
                <div className="flex items-start space-x-4">
                  {/* Preview */}
                  <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                    {file.previewUrl ? (
                      <Image
                        src={file.previewUrl}
                        alt={file.filename}
                        fill
                        className="object-cover"
                      />
                    ) : file.file?.type.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* File Info & Remove Button */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {file.filename}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.file && (file.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.filename)}
                        className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Metadata Forms */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign
                    </label>
                    <input
                      type="text"
                      value={file.campaign}
                      onChange={(e) => updateFileMetadata(file.filename, 'campaign', e.target.value)}
                      placeholder="e.g., Spring 2024"
                      className="
                        w-full px-3 py-2 rounded-lg border border-gray-300 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 hover:border-gray-400
                        text-gray-900 bg-white placeholder-gray-500
                      "
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={file.tags}
                      onChange={(e) => updateFileMetadata(file.filename, 'tags', e.target.value)}
                      placeholder="e.g., outdoor, lifestyle"
                      className="
                        w-full px-3 py-2 rounded-lg border border-gray-300 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 hover:border-gray-400
                        text-gray-900 bg-white placeholder-gray-500
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender Category
                    </label>
                    <select
                      value={file.gender_category}
                      onChange={(e) => updateFileMetadata(file.filename, 'gender_category', e.target.value as GenderCategory)}
                      className="
                        w-full px-3 py-2 rounded-lg border border-gray-300 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        transition-all duration-200 hover:border-gray-400
                        text-gray-900 bg-white
                      "
                    >
                      <option value="unisex">Unisex</option>
                      <option value="mens">Men&apos;s</option>
                      <option value="womens">Women&apos;s</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={file.notes}
                    onChange={(e) => updateFileMetadata(file.filename, 'notes', e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={2}
                    className="
                      w-full px-3 py-2 rounded-lg border border-gray-300 
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      transition-all duration-200 hover:border-gray-400
                      text-gray-900 bg-white placeholder-gray-500 resize-none
                    "
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Gallery */}
      {uploads.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress ({uploads.length} files)
            </h3>
            <button
              onClick={clearCompleted}
              className="
                text-sm text-gray-500 hover:text-gray-700 
                transition-colors duration-200
              "
            >
              Clear Completed
            </button>
          </div>
          
          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="
                  bg-white rounded-xl border border-gray-200 overflow-hidden
                  transform transition-all duration-300 hover:shadow-lg
                "
              >
                {/* Preview Area */}
                <div className="aspect-video bg-gray-100 relative">
                  {upload.previewUrl ? (
                    <Image
                      src={upload.previewUrl}
                      alt={upload.filename}
                      fill
                      className="object-cover"
                    />
                  ) : upload.file?.type.startsWith('video/') ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <p className="text-sm font-medium">Video</p>
                        <p className="text-xs opacity-80">{upload.file?.name.split('.').pop()?.toUpperCase()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        <p className="text-sm font-medium">File</p>
                        <p className="text-xs opacity-80">{upload.file?.name.split('.').pop()?.toUpperCase()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Overlay */}
                  <div className="absolute top-2 right-2">
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm
                      ${upload.status === 'complete' ? 'bg-green-100/90 text-green-800' : ''}
                      ${upload.status === 'error' ? 'bg-red-100/90 text-red-800' : ''}
                      ${upload.status === 'uploading' ? 'bg-blue-100/90 text-blue-800' : ''}
                      ${upload.status === 'processing' ? 'bg-yellow-100/90 text-yellow-800' : ''}
                    `}>
                      {upload.status === 'complete' && (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {upload.status === 'uploading' && (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-1"></div>
                      )}
                      {upload.status === 'error' && (
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {upload.status}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {upload.status === 'uploading' || upload.status === 'processing' ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm">
                      <div className="h-2 bg-gray-200/50">
                        <div
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                
                {/* File Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {upload.filename}
                      </h4>
                      {upload.file && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                    {upload.status === 'complete' && upload.assetId && (
                      <a
                        href={`/asset/${upload.assetId}`}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200 ml-2"
                      >
                        View →
                      </a>
                    )}
                  </div>
                  
                  {upload.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                      {upload.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}