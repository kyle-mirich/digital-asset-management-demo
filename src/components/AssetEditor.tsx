'use client'

import { useState } from 'react'
import { Asset, AssetUpdate, AssetStatus, STATUS_CONFIG, GenderCategory } from '@/types/asset'
import { supabase } from '@/lib/supabase'
import TagAutocomplete from './TagAutocomplete'

interface AssetEditorProps {
  asset: Asset
  onAssetUpdate: (updatedAsset: Asset) => void
  onClose: () => void
}

export default function AssetEditor({ asset, onAssetUpdate, onClose }: AssetEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<AssetUpdate & { filename: string }>({
    filename: asset.filename,
    campaign: asset.campaign || '',
    tags: asset.tags || [],
    status: asset.status,
    qc_passed: asset.qc_passed,
    notes: asset.notes || '',
    gender_category: asset.gender_category || 'unisex'
  })
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updatedData: any = {
        filename: formData.filename.trim(),
        campaign: formData.campaign?.trim() || null,
        tags: formData.tags,
        status: formData.status,
        qc_passed: formData.qc_passed,
        notes: formData.notes?.trim() || null,
        gender_category: formData.gender_category
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updatedData)
        .eq('id', asset.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating asset:', error)
        alert('Failed to update asset. Please try again.')
        return
      }

      onAssetUpdate(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Failed to update asset. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      filename: asset.filename,
      campaign: asset.campaign || '',
      tags: asset.tags || [],
      status: asset.status,
      qc_passed: asset.qc_passed,
      notes: asset.notes || '',
      gender_category: asset.gender_category || 'unisex'
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
            {asset.original_filename && asset.original_filename !== asset.filename && (
              <p className="text-xs text-gray-500 mt-1">Original: {asset.original_filename}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${STATUS_CONFIG[asset.status].color}
            `}>
              {STATUS_CONFIG[asset.status].label}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quality Control</label>
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${asset.qc_passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            `}>
              {asset.qc_passed ? '✅ Passed' : '❌ Not Passed'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gender Category</label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {asset.gender_category === 'mens' ? 'Men\'s' : asset.gender_category === 'womens' ? 'Women\'s' : 'Unisex'}
            </span>
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

        {/* Gender Category */}
        <div>
          <label htmlFor="gender_category" className="block text-sm font-medium text-gray-700 mb-2">
            Gender Category
          </label>
          <select
            id="gender_category"
            value={formData.gender_category}
            onChange={(e) => handleInputChange('gender_category', e.target.value as GenderCategory)}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-all duration-200
              hover:border-gray-400
              text-gray-900 bg-white
            "
          >
            <option value="unisex">Unisex</option>
            <option value="mens">Men's</option>
            <option value="womens">Women's</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <TagAutocomplete
            value={formData.tags}
            onChange={(tags) => handleInputChange('tags', tags)}
            placeholder="Add tags to organize your assets..."
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="
                w-full px-4 py-3 rounded-lg border border-gray-300 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-200 hover:border-gray-400
                text-gray-900 bg-white text-left flex items-center justify-between
              "
            >
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${STATUS_CONFIG[formData.status].color}
              `}>
                {STATUS_CONFIG[formData.status].label}
              </span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showStatusDropdown && (
              <div className="
                absolute top-full left-0 right-0 mt-1 
                bg-white border border-gray-300 rounded-lg shadow-lg z-10
              ">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      handleInputChange('status', status as AssetStatus)
                      setShowStatusDropdown(false)
                    }}
                    className="
                      w-full text-left px-4 py-3 hover:bg-gray-50
                      transition-colors duration-200 flex items-center space-x-3
                    "
                  >
                    <span className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${config.color}
                    `}>
                      {config.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QC Status */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.qc_passed}
              onChange={(e) => handleInputChange('qc_passed', e.target.checked)}
              className="
                w-5 h-5 text-blue-600 border-gray-300 rounded
                focus:ring-blue-500 focus:ring-2
              "
            />
            <span className="text-sm font-medium text-gray-700">
              Quality Control Passed
            </span>
          </label>
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

      </div>
    </div>
  )
}