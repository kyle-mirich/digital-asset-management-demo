'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ProductCreate, ProductCategory, PRODUCT_CATEGORIES } from '@/types/product'

export default function NewProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    category: 'shirt',
    status: 'draft'
  })

  const handleInputChange = (field: keyof ProductCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...formData,
          description: formData.description || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating product:', error)
        alert('Failed to create product. Please try again.')
        return
      }

      // Redirect to the new product page
      router.push(`/product/${data.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Failed to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create New Product</h1>
                <p className="text-sm text-gray-600">Add a new product to organize your assets</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Information</h2>
              <p className="text-sm text-gray-600">Basic details about your product</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., The Ultralight Tank"
                  className="
                    w-full px-4 py-3 rounded-lg border border-gray-300 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-all duration-200
                    hover:border-gray-400
                    text-gray-900 bg-white
                  "
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the product..."
                  rows={4}
                  className="
                    w-full px-4 py-3 rounded-lg border border-gray-300 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition-all duration-200
                    hover:border-gray-400
                    text-gray-900 bg-white
                    resize-none
                  "
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Category</h2>
              <p className="text-sm text-gray-600">Choose the product category</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(PRODUCT_CATEGORIES).map(([key, config]) => (
                <label
                  key={key}
                  className={`
                    relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                    transition-all duration-200 hover:scale-105
                    ${formData.category === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={formData.category === key}
                    onChange={(e) => handleInputChange('category', e.target.value as ProductCategory)}
                    className="sr-only"
                  />
                  <div className="text-3xl mb-2">{config.icon}</div>
                  <div className="text-sm font-medium text-center">{config.label}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Initial Status</h2>
              <p className="text-sm text-gray-600">Set the initial status for this product</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200 hover:scale-105
                ${formData.status === 'draft'
                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}>
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="sr-only"
                />
                <div className="text-2xl mb-2">📝</div>
                <div className="text-sm font-medium">Draft</div>
                <div className="text-xs text-gray-500 text-center mt-1">Work in progress</div>
              </label>

              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200 hover:scale-105
                ${formData.status === 'active'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}>
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="sr-only"
                />
                <div className="text-2xl mb-2">✅</div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-gray-500 text-center mt-1">Ready for production</div>
              </label>

              <label className={`
                relative flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200 hover:scale-105
                ${formData.status === 'archived'
                  ? 'border-slate-500 bg-slate-50 text-slate-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}>
                <input
                  type="radio"
                  name="status"
                  value="archived"
                  checked={formData.status === 'archived'}
                  onChange={(e) => handleInputChange('status', e.target.value as any)}
                  className="sr-only"
                />
                <div className="text-2xl mb-2">📦</div>
                <div className="text-sm font-medium">Archived</div>
                <div className="text-xs text-gray-500 text-center mt-1">No longer active</div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <Link
              href="/"
              className="
                inline-flex items-center px-6 py-3 rounded-lg
                bg-gray-100 text-gray-700 hover:bg-gray-200
                transition-all duration-200
                hover:scale-105
              "
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="
                inline-flex items-center px-6 py-3 rounded-lg
                bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium
                hover:from-blue-700 hover:to-purple-700 
                transform hover:scale-105 transition-all duration-200
                shadow-lg hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Create Product
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        {formData.name && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{PRODUCT_CATEGORIES[formData.category].icon}</span>
                    <h4 className="text-lg font-semibold text-gray-900">{formData.name}</h4>
                  </div>
                  {formData.description && (
                    <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Category:</span>
                    <span className="text-xs font-medium text-gray-700">
                      {PRODUCT_CATEGORIES[formData.category].label}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${formData.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                    ${formData.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${formData.status === 'archived' ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    {formData.status === 'draft' && 'Draft'}
                    {formData.status === 'active' && 'Active'}
                    {formData.status === 'archived' && 'Archived'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}