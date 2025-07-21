export type AssetStatus = 'draft' | 'in_review' | 'approved' | 'archived'
export type GenderCategory = 'mens' | 'womens' | 'unisex'

export interface Asset {
  id: string
  filename: string
  original_filename?: string
  file_url: string
  filetype: string
  filesize: number
  upload_time: string
  status: AssetStatus
  uploader_id: string
  product_id?: string
  campaign?: string
  tags: string[]
  qc_passed: boolean
  notes?: string
  gender_category: GenderCategory
  created_at: string
  updated_at: string
}

export interface AssetUpload {
  filename: string
  filetype: string
  filesize: number
  product_id?: string
  campaign?: string
  tags: string[]
  notes?: string
  gender_category?: GenderCategory
}

export interface AssetUpdate {
  product_id?: string
  campaign?: string
  tags?: string[]
  status?: AssetStatus
  qc_passed?: boolean
  notes?: string
  gender_category?: GenderCategory
}

export interface QCChecklistItem {
  id: string
  label: string
  checked: boolean
  required: boolean
}

export interface FilterState {
  campaign: string
  status: AssetStatus | 'all'
  tags: string[]
  search: string
  gender_category?: GenderCategory | 'all'
}

export interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  file?: File
  previewUrl?: string
  assetId?: string
}

// Status workflow transitions
export const STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  draft: ['in_review'],
  in_review: ['approved', 'draft'],
  approved: ['archived'],
  archived: ['draft']
}

// Status colors and labels
export const STATUS_CONFIG = {
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

// File type configurations
export const FILE_TYPES = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    icon: '🖼️',
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  video: {
    extensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
    icon: '🎬',
    maxSize: 100 * 1024 * 1024 // 100MB
  }
} as const

export type FileType = keyof typeof FILE_TYPES
export type ImageExtension = typeof FILE_TYPES.image.extensions[number]
export type VideoExtension = typeof FILE_TYPES.video.extensions[number]
export type AllowedExtension = ImageExtension | VideoExtension