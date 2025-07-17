'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AssetChecklistItem } from '@/types/product'

interface AssetChecklistProps {
  assetId: string
  onChecklistUpdate?: (completedRequired: number, totalRequired: number) => void
}

export default function AssetChecklist({ assetId, onChecklistUpdate }: AssetChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<AssetChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchChecklistItems()
  }, [assetId])

  useEffect(() => {
    if (onChecklistUpdate && checklistItems.length > 0) {
      const totalRequired = checklistItems.filter(item => item.is_required).length
      const completedRequired = checklistItems.filter(item => item.is_required && item.is_completed).length
      onChecklistUpdate(completedRequired, totalRequired)
    }
  }, [checklistItems, onChecklistUpdate])

  const fetchChecklistItems = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('asset_checklist_items')
        .select('*')
        .eq('asset_id', assetId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching checklist items:', error)
        return
      }

      setChecklistItems(data || [])
    } catch (error) {
      console.error('Error fetching checklist items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    setIsUpdating(itemId)
    try {
      const { error } = await supabase
        .from('asset_checklist_items')
        .update({ is_completed: isCompleted })
        .eq('id', itemId)

      if (error) {
        console.error('Error updating checklist item:', error)
        alert('Failed to update checklist item. Please try again.')
        return
      }

      // Update local state
      setChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, is_completed: isCompleted }
            : item
        )
      )
    } catch (error) {
      console.error('Error updating checklist item:', error)
      alert('Failed to update checklist item. Please try again.')
    } finally {
      setIsUpdating(null)
    }
  }

  const getProgress = () => {
    const totalRequired = checklistItems.filter(item => item.is_required).length
    const completedRequired = checklistItems.filter(item => item.is_required && item.is_completed).length
    const totalOptional = checklistItems.filter(item => !item.is_required).length
    const completedOptional = checklistItems.filter(item => !item.is_required && item.is_completed).length
    
    return {
      totalRequired,
      completedRequired,
      totalOptional,
      completedOptional,
      progressPercentage: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!checklistItems.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Checklist</h3>
        <p className="text-sm text-gray-600">No checklist items found for this asset.</p>
      </div>
    )
  }

  const progress = getProgress()
  const requiredItems = checklistItems.filter(item => item.is_required)
  const optionalItems = checklistItems.filter(item => !item.is_required)

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header with Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Asset Checklist</h3>
          <span className={`
            inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
            ${progress.completedRequired === progress.totalRequired 
              ? 'bg-green-100 text-green-800' 
              : 'bg-orange-100 text-orange-800'
            }
          `}>
            {progress.completedRequired}/{progress.totalRequired} Required
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              progress.progressPercentage === 100 ? 'bg-green-500' : 'bg-orange-500'
            }`}
            style={{ width: `${progress.progressPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {progress.progressPercentage}% complete • {progress.completedOptional}/{progress.totalOptional} optional items
        </p>
      </div>

      {/* Required Items */}
      {requiredItems.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Required Items
          </h4>
          <div className="space-y-3">
            {requiredItems.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200
                  ${item.is_completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <button
                  onClick={() => toggleChecklistItem(item.id, !item.is_completed)}
                  disabled={isUpdating === item.id}
                  className={`
                    flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
                    ${item.is_completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                    }
                    ${isUpdating === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    flex items-center justify-center
                  `}
                >
                  {isUpdating === item.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  ) : item.is_completed ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </button>
                <div className="flex-1">
                  <p className={`
                    text-sm font-medium transition-all duration-200
                    ${item.is_completed ? 'text-green-800 line-through' : 'text-gray-900'}
                  `}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className={`
                      text-xs mt-1 transition-all duration-200
                      ${item.is_completed ? 'text-green-600' : 'text-gray-600'}
                    `}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Items */}
      {optionalItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Optional Items
          </h4>
          <div className="space-y-3">
            {optionalItems.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200
                  ${item.is_completed 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <button
                  onClick={() => toggleChecklistItem(item.id, !item.is_completed)}
                  disabled={isUpdating === item.id}
                  className={`
                    flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
                    ${item.is_completed
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-gray-300 hover:border-orange-400'
                    }
                    ${isUpdating === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    flex items-center justify-center
                  `}
                >
                  {isUpdating === item.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                  ) : item.is_completed ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : null}
                </button>
                <div className="flex-1">
                  <p className={`
                    text-sm font-medium transition-all duration-200
                    ${item.is_completed ? 'text-orange-800 line-through' : 'text-gray-900'}
                  `}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className={`
                      text-xs mt-1 transition-all duration-200
                      ${item.is_completed ? 'text-orange-600' : 'text-gray-600'}
                    `}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-promotion notice */}
      {progress.totalRequired > 0 && progress.completedRequired === progress.totalRequired && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-green-800">All required items completed!</p>
              <p className="text-green-600">This asset is eligible for review status promotion.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}