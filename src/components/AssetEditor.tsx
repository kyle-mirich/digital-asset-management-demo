'use client'

import { useState } from 'react'
import { Asset } from '@/types/asset'
import { supabase } from '@/lib/supabase'

interface AssetEditorProps {
  asset: Asset
  onAssetUpdate: (updatedAsset: Asset) => void
  onClose: () => void
}

export default function AssetEditor({ asset, onAssetUpdate, onClose }: AssetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    filename: asset.filename,
    campaign: asset.campaign || '',
    tags: asset.tags?.join(', ') || '',
    notes: asset.notes || ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedData = {
        filename: formData.filename,
        campaign: formData.campaign || null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        notes: formData.notes || null
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updatedData)
        .eq('id', asset.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating asset:', error)
        return
      }

      onAssetUpdate(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving asset:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      filename: asset.filename,
      campaign: asset.campaign || '',
      tags: asset.tags?.join(', ') || '',
      notes: asset.notes || ''
    })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Asset Metadata</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="
              inline-flex items-center px-3 py-2 rounded-lg
              bg-blue-100 text-blue-700 hover:bg-blue-200
              transition-all duration-200
              hover:scale-105
            "
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Metadata
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filename</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{asset.filename}</p>
          </div>

          {asset.campaign && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{asset.campaign}</p>
            </div>
          )}

          {asset.tags && asset.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      bg-blue-100 text-blue-700 border border-blue-200
                    "
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {asset.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{asset.notes}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Edit Asset Metadata</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCancel}
            className="
              inline-flex items-center px-3 py-2 rounded-lg
              bg-gray-100 text-gray-700 hover:bg-gray-200
              transition-all duration-200
              hover:scale-105
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="
              inline-flex items-center px-3 py-2 rounded-lg
              bg-gradient-to-r from-green-600 to-green-700 text-white font-medium
              hover:from-green-700 hover:to-green-800 
              transform hover:scale-105 transition-all duration-200
              shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filename */}
        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            id="filename"
            type="text"
            value={formData.filename}
            onChange={(e) => handleInputChange('filename', e.target.value)}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              text-gray-900 bg-white
            "
            placeholder="Enter filename..."
          />
        </div>

        {/* Campaign */}
        <div>
          <label htmlFor="campaign" className="block text-sm font-medium text-gray-700 mb-2">
            Campaign
          </label>
          <input
            id="campaign"
            type="text"
            value={formData.campaign}
            onChange={(e) => handleInputChange('campaign', e.target.value)}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              text-gray-900 bg-white
            "
            placeholder="e.g., Spring 2024, Product Launch..."
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (comma separated)
          </label>
          <input
            id="tags"
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              text-gray-900 bg-white
            "
            placeholder="e.g., outdoor, lifestyle, product, summer..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas. They will be used for filtering and search.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              text-gray-900 bg-white
              resize-none
            "
            placeholder="Add any additional notes or context about this asset..."
          />
        </div>

        {/* Preview Tags */}
        {formData.tags && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tag Preview</label>
            <div className="flex flex-wrap gap-2">
              {formData.tags.split(',').map((tag, index) => {
                const trimmedTag = tag.trim()
                return trimmedTag ? (
                  <span
                    key={index}
                    className="
                      inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                      bg-blue-100 text-blue-700 border border-blue-200
                      transition-all duration-200
                      hover:bg-blue-200
                    "
                  >
                    {trimmedTag}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}