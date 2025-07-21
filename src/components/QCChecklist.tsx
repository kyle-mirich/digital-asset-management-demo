'use client'

import { useState } from 'react'
import { QCChecklistItem } from '@/types/asset'

interface QCChecklistProps {
  assetId?: string
  items?: QCChecklistItem[]
  onComplete?: (passed: boolean) => void
  disabled?: boolean
}

const defaultQCItems: QCChecklistItem[] = [
  {
    id: 'format',
    label: 'File format is correct (JPG, PNG, MP4, etc.)',
    checked: false,
    required: true
  },
  {
    id: 'resolution',
    label: 'Resolution meets minimum requirements',
    checked: false,
    required: true
  },
  {
    id: 'naming',
    label: 'File naming follows conventions',
    checked: false,
    required: true
  },
  {
    id: 'quality',
    label: 'Image/video quality is acceptable',
    checked: false,
    required: true
  },
  {
    id: 'content',
    label: 'Content is appropriate and on-brand',
    checked: false,
    required: true
  },
  {
    id: 'metadata',
    label: 'Metadata and tags are accurate',
    checked: false,
    required: false
  },
  {
    id: 'licensing',
    label: 'Usage rights and licensing are clear',
    checked: false,
    required: false
  }
]

export default function QCChecklist({ 
  items = defaultQCItems, 
  onComplete,
  disabled = false 
}: QCChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<QCChecklistItem[]>(items)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState('')

  const handleItemToggle = (itemId: string) => {
    if (disabled) return
    
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, checked: !item.checked }
        : item
    ))
  }

  const requiredItems = checklistItems.filter(item => item.required)
  const requiredChecked = requiredItems.filter(item => item.checked)
  const optionalItems = checklistItems.filter(item => !item.required)
  // const optionalChecked = optionalItems.filter(item => item.checked)

  const allRequiredPassed = requiredItems.length === requiredChecked.length
  const progressPercentage = Math.round((requiredChecked.length / requiredItems.length) * 100)

  const handleSubmit = async () => {
    if (!allRequiredPassed) return
    
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onComplete) {
        onComplete(true)
      }
    } catch (error) {
      console.error('QC submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`
              p-2 rounded-lg transition-all duration-300
              ${allRequiredPassed 
                ? 'bg-green-100 scale-110' 
                : 'bg-yellow-100'
              }
            `}>
              <svg className={`
                w-5 h-5 transition-colors duration-300
                ${allRequiredPassed ? 'text-green-600' : 'text-yellow-600'}
              `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quality Control Checklist</h3>
              <p className="text-sm text-gray-500">
                Review and validate asset quality
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {progressPercentage}%
            </div>
            <div className="text-sm text-gray-500">
              {requiredChecked.length} / {requiredItems.length} required
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`
                h-2 rounded-full transition-all duration-500 ease-out
                ${allRequiredPassed 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }
              `}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Required Items */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Required Checks
        </h4>
        <div className="space-y-3">
          {requiredItems.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border
                transition-all duration-200
                ${item.checked 
                  ? 'bg-green-50 border-green-200 scale-[1.02]' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              `}
              onClick={() => handleItemToggle(item.id)}
            >
              <div className={`
                relative w-5 h-5 rounded border-2 
                transition-all duration-200
                ${item.checked 
                  ? 'bg-green-500 border-green-500' 
                  : 'bg-white border-gray-300'
                }
              `}>
                {item.checked && (
                  <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`
                text-sm font-medium transition-colors duration-200
                ${item.checked ? 'text-green-800' : 'text-gray-700'}
              `}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Items */}
      <div className="px-6 py-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Optional Checks
        </h4>
        <div className="space-y-3">
          {optionalItems.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center space-x-3 p-3 rounded-lg border
                transition-all duration-200
                ${item.checked 
                  ? 'bg-blue-50 border-blue-200 scale-[1.02]' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              `}
              onClick={() => handleItemToggle(item.id)}
            >
              <div className={`
                relative w-5 h-5 rounded border-2 
                transition-all duration-200
                ${item.checked 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-white border-gray-300'
                }
              `}>
                {item.checked && (
                  <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`
                text-sm font-medium transition-colors duration-200
                ${item.checked ? 'text-blue-800' : 'text-gray-700'}
              `}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="px-6 py-4 border-t border-gray-100">
        <label htmlFor="qc-notes" className="block text-sm font-medium text-gray-700 mb-2">
          QC Notes (optional)
        </label>
        <textarea
          id="qc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the quality check..."
          rows={3}
          disabled={disabled}
          className="
            w-full px-4 py-3 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            hover:border-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
          "
        />
      </div>

      {/* Submit Button */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={handleSubmit}
          disabled={!allRequiredPassed || isSubmitting || disabled}
          className={`
            w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium
            transition-all duration-200
            ${allRequiredPassed && !disabled
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              Submitting QC...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {allRequiredPassed ? 'Approve Asset' : 'Complete Required Checks'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}