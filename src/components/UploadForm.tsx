'use client'

import { useState, useRef } from 'react'
import { uploadFile, supabase } from '@/lib/supabase'
import { AssetUpload, UploadProgress, FILE_TYPES } from '@/types/asset'

interface UploadFormProps {
  onUploadComplete?: (assetId: string) => void
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [campaign, setCampaign] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
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

    const isImage = FILE_TYPES.image.extensions.includes(fileExtension)
    const isVideo = FILE_TYPES.video.extensions.includes(fileExtension)

    if (!isImage && !isVideo) {
      return { valid: false, error: 'Only image and video files are allowed' }
    }

    const maxSize = isImage ? FILE_TYPES.image.maxSize : FILE_TYPES.video.maxSize
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` }
    }

    return { valid: true }
  }

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validation = validateFile(file)
      if (!validation.valid) {
        // Add error state for invalid files
        setUploads(prev => [...prev, {
          filename: file.name,
          progress: 0,
          status: 'error',
          error: validation.error
        }])
        return false
      }
      return true
    })

    // Initialize upload progress for valid files
    const newUploads = validFiles.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'uploading' as const
    }))

    setUploads(prev => [...prev, ...newUploads])

    // Upload files
    for (const file of validFiles) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        
        // If bucket doesn't exist, try to create it
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
        campaign: campaign || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        notes: notes || undefined
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

      // Update progress to complete
      setUploads(prev => prev.map(upload => 
        upload.filename === file.name 
          ? { ...upload, progress: 100, status: 'complete' as const }
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

      {/* Metadata Fields */}
      <div className="space-y-4">
        <div>
          <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign
          </label>
          <input
            id="campaign"
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g., Spring 2024, Product Launch"
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
            "
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., outdoor, lifestyle, product"
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
            "
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or context..."
            rows={3}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              resize-none
            "
          />
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
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
          <div className="space-y-2">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="
                  p-4 rounded-lg border bg-white
                  transform transition-all duration-300
                  hover:shadow-md
                "
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {upload.filename}
                  </span>
                  <span className={`
                    text-xs px-2 py-1 rounded-full font-medium
                    ${upload.status === 'complete' ? 'bg-green-100 text-green-800' : ''}
                    ${upload.status === 'error' ? 'bg-red-100 text-red-800' : ''}
                    ${upload.status === 'uploading' ? 'bg-blue-100 text-blue-800' : ''}
                    ${upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {upload.status}
                  </span>
                </div>
                {upload.status !== 'error' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="
                        bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full
                        transition-all duration-300
                      "
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
                {upload.error && (
                  <p className="text-sm text-red-600 mt-1">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}