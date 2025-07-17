# VuoriFlow – Asset Lifecycle Tracker

VuoriFlow is a lightweight Digital Asset Management (DAM) app that demonstrates an end-to-end creative workflow from upload to archival, built for showcasing DAM proficiency in alignment with Vuori's values and operational needs.

## 🧩 Features

- Upload photo/video to Supabase Storage
- Auto-generate metadata: filename, timestamp, file type, uploader
- Manual and bulk tagging support
- Status workflow: `Draft → In Review → Approved → Archived`
- QC checklist: format, resolution, naming conventions
- Filter/search assets by campaign, creator, file type, or status

## 🧠 Why it Works for Vuori

- Mirrors Vuori’s actual asset pipeline
- Highlights attention to metadata structure and workflow logic
- Showcases use of modern stack (Next.js + Supabase)

---

## 📁 File Structure

```
├── vuoriflow/
│   ├── components/
│   │   ├── AssetCard.tsx
│   │   ├── UploadForm.tsx
│   │   ├── FilterPanel.tsx
│   │   └── QCChecklist.tsx
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── asset/[id].tsx
│   │   └── upload.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── styles/
│   │   └── globals.css
│   ├── types/
│   │   └── asset.ts
│   ├── public/
│   └── .env.local.example
├── schema.sql
├── README.md
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── next.config.js
├── package.json
```

---

## 🧾 Database Schema (schema.sql)

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  file_url TEXT,
  filetype TEXT,
  filesize INTEGER,
  upload_time TIMESTAMP DEFAULT now(),
  status TEXT CHECK (status IN ('draft', 'in_review', 'approved', 'archived')),
  uploader_id UUID REFERENCES auth.users (id),
  campaign TEXT,
  tags TEXT[],
  qc_passed BOOLEAN DEFAULT false,
  notes TEXT
);
```

---

## 🔌 Supabase Client Setup (lib/supabase.ts)

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 📤 Basic Upload Form (components/UploadForm.tsx)

```tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    const { data, error } = await supabase.storage.from('assets').upload(`uploads/${file.name}`, file);
    // Insert metadata into DB...
  };

  return (
    <div className="p-4">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

---

## 🛠 API Endpoints (for future integration)

| Endpoint                  | Method | Description                          |
|---------------------------|--------|--------------------------------------|
| `/api/assets/upload`      | POST   | Handle new file + metadata           |
| `/api/assets`             | GET    | Fetch all assets                     |
| `/api/assets/:id`         | GET    | Fetch asset detail                   |
| `/api/assets/:id/update`  | PUT    | Update tags, status                  |
| `/api/assets/:id/qc`      | POST   | Submit QC results                    |

---

## 🔐 Roles & Permissions (suggested)

| Role        | Access Rights                              |
|-------------|---------------------------------------------|
| Admin       | Full access to all features                 |
| Team Member | Upload, tag, mark QC, view status           |
| Viewer      | Search & download only                     |

---

## 🌈 Design Suggestions

- Vuori-style UI: Minimalist, clean, coastal vibes
- Responsive layout with lazy-loading thumbnails
- Use TailwindCSS for fast prototyping

---

## 🚀 Deployment

- Frontend: Next.js (Vercel)
- Backend: Supabase (Auth + DB + Storage)
- Optional demo: `https://vuoriflow.vercel.app`

---

Let me know if you want to add filtering, asset detail pages, or roles next!
