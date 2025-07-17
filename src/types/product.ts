export type ProductCategory = 'shirt' | 'pants' | 'shorts' | 'tank' | 'jacket' | 'hoodie' | 'accessories' | 'other'
export type ProductStatus = 'draft' | 'in_review' | 'approved' | 'archived'

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  status: ProductStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  name: string
  description?: string
  category: ProductCategory
  status?: ProductStatus
}

export interface ProductUpdate {
  name?: string
  description?: string
  category?: ProductCategory
  status?: ProductStatus
}

export interface ProductWithAssets extends Product {
  asset_count: number
  assets?: Array<{
    id: string
    filename: string
    file_url: string
    filetype: string
    status: string
  }>
}

// Product workflow transitions
export const PRODUCT_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  draft: ['in_review'],
  in_review: ['approved', 'draft'],
  approved: ['archived'],
  archived: ['draft']
}

// Product status colors and labels
export const PRODUCT_STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    hoverColor: 'hover:bg-gray-200'
  },
  in_review: {
    label: 'In Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hoverColor: 'hover:bg-yellow-200'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    hoverColor: 'hover:bg-green-200'
  },
  archived: {
    label: 'Archived',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    hoverColor: 'hover:bg-slate-200'
  }
} as const

// Product category configurations
export const PRODUCT_CATEGORIES: Record<ProductCategory, { label: string; icon: string }> = {
  shirt: {
    label: 'Shirt',
    icon: '👕'
  },
  pants: {
    label: 'Pants',
    icon: '👖'
  },
  shorts: {
    label: 'Shorts',
    icon: '🩳'
  },
  tank: {
    label: 'Tank',
    icon: '🎽'
  },
  jacket: {
    label: 'Jacket',
    icon: '🧥'
  },
  hoodie: {
    label: 'Hoodie',
    icon: '👘'
  },
  accessories: {
    label: 'Accessories',
    icon: '🎒'
  },
  other: {
    label: 'Other',
    icon: '📦'
  }
} as const

export type ProductCategoryConfig = typeof PRODUCT_CATEGORIES

// Checklist types
export interface ChecklistItem {
  id: string
  title: string
  description?: string
  is_completed: boolean
  is_required: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProductChecklistItem extends ChecklistItem {
  product_id: string
}

export interface AssetChecklistItem extends ChecklistItem {
  asset_id: string
}

// Tag types
export interface Tag {
  id: string
  name: string
  usage_count: number
  created_at: string
}

export interface TagSuggestion {
  id: string
  name: string
  usage_count: number
}