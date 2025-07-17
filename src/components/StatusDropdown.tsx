'use client'

import { useState, useRef, useEffect } from 'react'
import { AssetStatus, STATUS_CONFIG, STATUS_TRANSITIONS } from '@/types/asset'

interface StatusDropdownProps {
  currentStatus: AssetStatus
  onStatusChange: (newStatus: AssetStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusDropdown({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  size = 'md'
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusChange = async (newStatus: AssetStatus) => {
    if (disabled || isChanging) return

    setIsChanging(true)
    setIsOpen(false)

    try {
      await onStatusChange(newStatus)
    } catch (error) {
      console.error('Status change failed:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || []
  const currentConfig = STATUS_CONFIG[currentStatus]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isChanging}
        className={`
          inline-flex items-center justify-center border rounded-lg font-medium
          transition-all duration-200
          ${sizeClasses[size]}
          ${currentConfig.color}
          ${disabled || isChanging
            ? 'opacity-50 cursor-not-allowed'
            : `${currentConfig.hoverColor} hover:scale-105 active:scale-95`
          }
        `}
      >
        {isChanging ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-1"></div>
            Updating...
          </>
        ) : (
          <>
            <div className={`
              w-2 h-2 rounded-full mr-2 transition-all duration-200
              ${currentStatus === 'draft' ? 'bg-gray-400' : ''}
              ${currentStatus === 'in_review' ? 'bg-yellow-400' : ''}
              ${currentStatus === 'approved' ? 'bg-green-400' : ''}
              ${currentStatus === 'archived' ? 'bg-slate-400' : ''}
            `}></div>
            {currentConfig.label}
            <svg className={`
              w-4 h-4 ml-1 transition-transform duration-200
              ${isOpen ? 'rotate-180' : ''}
            `} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`
          absolute z-50 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5
          transform transition-all duration-200
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          ${size === 'sm' ? 'right-0' : 'left-0'}
        `}>
          <div className="py-1">
            {/* Current Status */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className={`
                  w-2 h-2 rounded-full mr-2
                  ${currentStatus === 'draft' ? 'bg-gray-400' : ''}
                  ${currentStatus === 'in_review' ? 'bg-yellow-400' : ''}
                  ${currentStatus === 'approved' ? 'bg-green-400' : ''}
                  ${currentStatus === 'archived' ? 'bg-slate-400' : ''}
                `}></div>
                <span className="text-sm font-medium text-gray-900">
                  Current: {currentConfig.label}
                </span>
              </div>
            </div>

            {/* Available Transitions */}
            <div className="py-1">
              <div className="px-3 py-1">
                <span className="text-xs text-gray-500 font-medium">Change to:</span>
              </div>
              {availableTransitions.length > 0 ? (
                availableTransitions.map((status) => {
                  const config = STATUS_CONFIG[status]
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm
                        transition-all duration-200
                        hover:bg-gray-50 hover:scale-105
                        active:scale-95
                      `}
                    >
                      <div className={`
                        w-2 h-2 rounded-full mr-2 transition-all duration-200
                        ${status === 'draft' ? 'bg-gray-400' : ''}
                        ${status === 'in_review' ? 'bg-yellow-400' : ''}
                        ${status === 'approved' ? 'bg-green-400' : ''}
                        ${status === 'archived' ? 'bg-slate-400' : ''}
                      `}></div>
                      <span className="text-gray-900">{config.label}</span>
                      <svg className="w-4 h-4 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )
                })
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  No transitions available
                </div>
              )}
            </div>

            {/* Workflow Info */}
            <div className="px-3 py-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <div className="font-medium mb-1">Workflow:</div>
                <div className="flex items-center space-x-1">
                  <span className="px-1 py-0.5 bg-gray-100 rounded text-xs">Draft</span>
                  <span>→</span>
                  <span className="px-1 py-0.5 bg-yellow-100 rounded text-xs">Review</span>
                  <span>→</span>
                  <span className="px-1 py-0.5 bg-green-100 rounded text-xs">Approved</span>
                  <span>→</span>
                  <span className="px-1 py-0.5 bg-slate-100 rounded text-xs">Archived</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}