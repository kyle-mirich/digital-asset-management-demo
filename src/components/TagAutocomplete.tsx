'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { TagSuggestion } from '@/types/product'

interface TagAutocompleteProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
}

export default function TagAutocomplete({ 
  value = [], 
  onChange, 
  placeholder = "Add tags...",
  className = ""
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch tag suggestions based on input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([])
        return
      }

      try {
        const { data, error } = await supabase
          .from('tags')
          .select('id, name, usage_count')
          .ilike('name', `%${inputValue}%`)
          .order('usage_count', { ascending: false })
          .limit(8)

        if (error) {
          console.error('Error fetching tag suggestions:', error)
          return
        }

        // Filter out already selected tags
        const filteredSuggestions = data.filter(tag => 
          !value.includes(tag.name)
        )

        setSuggestions(filteredSuggestions)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }

    fetchSuggestions()
  }, [inputValue, value])

  const addTag = async (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase()
    if (!trimmedTag || value.includes(trimmedTag)) return

    // Add to current tags
    onChange([...value, trimmedTag])

    // Update tag usage in database
    try {
      await supabase.rpc('increment_tag_usage', { tag_name: trimmedTag })
    } catch (error) {
      console.error('Error updating tag usage:', error)
    }

    // Clear input
    setInputValue('')
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        // Select highlighted suggestion
        addTag(suggestions[selectedIndex].name)
      } else if (inputValue.trim()) {
        // Add new tag from input
        addTag(inputValue)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag if input is empty
      removeTag(value[value.length - 1])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSuggestionClick = (suggestion: TagSuggestion) => {
    addTag(suggestion.name)
  }

  return (
    <div className="relative">
      {/* Tag display and input */}
      <div className={`
        flex flex-wrap items-center gap-2 p-3 border border-gray-300 rounded-lg
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
        transition-all duration-200 hover:border-gray-400
        bg-white min-h-[3rem]
        ${className}
      `}>
        {/* Existing tags */}
        {value.map((tag, index) => (
          <span
            key={index}
            className="
              inline-flex items-center px-3 py-1 rounded-full text-sm
              bg-blue-100 text-blue-800 border border-blue-200
              hover:bg-blue-200 transition-colors duration-200
            "
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="
                ml-2 text-blue-600 hover:text-blue-800
                transition-colors duration-200
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow click events
            setTimeout(() => setShowSuggestions(false), 150)
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="
            flex-1 min-w-[120px] outline-none bg-transparent
            text-gray-900 placeholder-gray-500
          "
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-1 
          bg-white border border-gray-300 rounded-lg shadow-lg
          z-50 max-h-48 overflow-y-auto
        ">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`
                w-full text-left px-4 py-2 hover:bg-gray-50
                transition-colors duration-200 flex items-center justify-between
                ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
              `}
            >
              <span>{suggestion.name}</span>
              <span className="text-xs text-gray-500">
                {suggestion.usage_count} use{suggestion.usage_count !== 1 ? 's' : ''}
              </span>
            </button>
          ))}
          
          {/* Option to create new tag if no exact match */}
          {inputValue && !suggestions.some(s => s.name.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className={`
                w-full text-left px-4 py-2 hover:bg-gray-50
                transition-colors duration-200 border-t border-gray-100
                ${selectedIndex === suggestions.length ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
              `}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create &quot;<strong>{inputValue}</strong>&quot;
              </span>
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1">
        Type to search existing tags or press Enter to create new ones
      </p>
    </div>
  )
}