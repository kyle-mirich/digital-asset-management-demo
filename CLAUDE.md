# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VuoriFlow** is a Next.js-based Digital Asset Management (DAM) system built with TypeScript, React, Supabase, and Tailwind CSS. The application manages the lifecycle of digital assets (images/videos) from upload through approval to archival, with status workflows, quality control checklists, and advanced filtering capabilities.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm install          # Install dependencies

# Production
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint checks
```

## Project Structure & Architecture

### Core Architecture
- **Frontend**: Next.js 15 App Router with React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **File Storage**: Supabase Storage with public bucket named "assets"
- **Authentication**: Supabase Auth with Row Level Security (RLS)

### Key Components
- **AssetCard.tsx**: Individual asset display with status management
- **UploadForm.tsx**: File upload interface with drag & drop
- **FilterPanel.tsx**: Advanced filtering by status, campaign, tags, search
- **QCChecklist.tsx**: Quality control workflow component
- **StatusDropdown.tsx**: Asset status transition management

### Database Schema
The main `assets` table includes:
- Asset metadata (filename, file_url, filetype, filesize)
- Workflow status ('draft' → 'in_review' → 'approved' → 'archived')
- Campaign organization and tag-based categorization
- Quality control tracking (qc_passed boolean)
- User ownership via uploader_id (RLS-secured)

### Status Workflow
Assets follow a defined workflow:
```
draft → in_review → approved → archived
  ↑         ↓           ↓
  ←─────────┴───────────┘
```

### Environment Setup
Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key

### Database Setup
Run `schema.sql` to set up the database schema and storage policies. The setup includes RLS policies for secure multi-user access and a storage bucket configuration for file uploads.

## Key Development Patterns

### Supabase Integration
- All database operations use the centralized client in `src/lib/supabase.ts`
- File uploads use helper functions: `uploadFile()`, `getPublicUrl()`, `deleteFile()`
- Real-time updates available but not currently implemented

### Type Safety
- Comprehensive TypeScript types in `src/types/asset.ts`
- Status transitions defined as `STATUS_TRANSITIONS` constant
- File type validation with size limits per type

### State Management
- React state for local component state
- Supabase for server state
- No external state management library used

## File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/assets/        # API routes for asset operations
│   ├── asset/[id]/        # Individual asset detail pages
│   └── upload/            # Asset upload interface
├── components/            # Reusable React components
├── lib/supabase.ts       # Supabase client configuration
└── types/asset.ts        # TypeScript type definitions
```

## Configuration Files
- **next.config.ts**: Configures image domains for Supabase storage
- **eslint.config.mjs**: ESLint setup with Next.js and TypeScript rules
- **tsconfig.json**: TypeScript configuration with path aliases (`@/*`)
- **package.json**: Dependencies include Next.js 15, React 19, Supabase client, date-fns