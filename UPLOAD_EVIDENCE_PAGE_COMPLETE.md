# 📤 UPLOAD EVIDENCE PAGE — COMPLETE

**Status:** IMPLEMENTED  
**Date:** 2026-01-25  
**Feature:** Case Selection for Evidence Upload

---

## ✅ WHAT WAS BUILT

Created an Upload Evidence page with:
1. **Case Selection Grid** - Choose which case to add evidence to
2. **File Type Info Cards** - Show supported file types
3. **Search Functionality** - Find cases quickly
4. **Evidence Guidelines** - Help users prepare files
5. **Smart Filtering** - Only shows active cases (not closed)

---

## 📤 UPLOAD EVIDENCE PAGE (`/upload-evidence`)

### Features

**1. Header Section**

- **Title:** "Upload Evidence"
  - Large gradient text (indigo → purple → pink)
  - 5xl font size
  
- **Subtitle:** "Select a case to add supporting documents and evidence"
  - Slate-400 color
  - Large text (text-lg)

---

**2. File Type Info Cards (4 Cards)**

Shows what types of files users can upload:

**Documents Card:**
- Icon: FileText
- Title: "Documents"
- Description: "PDFs, contracts, letters"
- Gradient: Indigo → Purple

**Images Card:**
- Icon: Image
- Title: "Images"
- Description: "Photos, screenshots, scans"
- Gradient: Cyan → Blue

**Videos Card:**
- Icon: FileVideo
- Title: "Videos"
- Description: "Recordings, clips, footage"
- Gradient: Emerald → Teal

**Other Files Card:**
- Icon: File
- Title: "Other Files"
- Description: "Any supporting evidence"
- Gradient: Orange → Red

**Layout:** 4 columns on desktop → 2 on tablet → 1 on mobile

---

**3. Search Bar**

- Large input field (h-14)
- Search icon prefix
- Glass morphism background
- Placeholder: "Search cases..."
- Real-time filtering
- Only shows if cases exist

---

**4. Case Cards (Clickable)**

Each case displays as a selectable card:

**Card Header:**
- Case title (truncated if long)
- Case type (humanized, capitalized)
- Arrow icon (slides right on hover)

**Status & Tags:**
- **Lifecycle status badge** (gradient)
  - Draft, Sent, Awaiting Response, etc.
- **AI Ready badge** (if strategyLocked)
  - Purple with Sparkles icon
- **Evidence count badge** (if evidence exists)
  - Emerald with CheckCircle icon
  - Shows number of existing evidence items

**Card Footer:**
- Creation date with Calendar icon
- "Select case →" text (appears on hover)

**Interactions:**
- Hover: Scale up, glow effect, gradient overlay
- Click: Navigate to case page with upload mode
- Smooth transitions

---

**5. Empty States**

**No Cases:**
- Folder icon with animated glow
- "No active cases"
- Helpful message
- "Create Your First Case" button
- Links to `/disputes/start`

**No Search Results:**
- AlertCircle icon
- "No cases found"
- "Try adjusting your search"
- "Clear search" button

---

**6. Evidence Guidelines Card**

At the bottom, helpful tips:

**Guidelines List:**
- ✅ Upload clear, legible documents and images
- ✅ Include dates, signatures, and relevant details
- ✅ Organize by type (contracts, receipts, correspondence)
- ✅ Remove sensitive information like bank details if not needed

**Styling:**
- AlertCircle icon in indigo box
- Glass morphism card
- Check icons for each guideline
- Slate-400 text

---

## 🎨 Design Features

### Card Hover Effects
- **Scale:** 1.02x
- **Border:** Indigo glow
- **Background:** Gradient overlay fade-in
- **Arrow:** Translates right
- **Text:** Color change to indigo

### Color Scheme
- **Gradients:** Indigo, purple, pink (header)
- **Status badges:** Colored per lifecycle
- **File type cards:** Unique gradient per type
- **Interactive elements:** Indigo/purple theme

### Layout
```
┌────────────────────────────────┐
│  Upload Evidence               │
├────────────────────────────────┤
│  [Doc] [Image] [Video] [File]  │
├────────────────────────────────┤
│  [Search Bar]                  │
├────────────────────────────────┤
│  Select a case (X cases)       │
├────────────────────────────────┤
│  [Case] [Case] [Case]          │
│  [Case] [Case] [Case]          │
├────────────────────────────────┤
│  📋 Evidence Guidelines        │
└────────────────────────────────┘
```

---

## 🔄 User Flow

### Complete Flow:

1. **User clicks "Upload Evidence" on dashboard**
2. **Navigates to `/upload-evidence`**
3. **Sees all active cases (not closed)**
4. **Can search/filter cases**
5. **Clicks on a case card**
6. **Redirects to case page with `?upload=true` param**
7. **Case page shows upload interface** (to be implemented)

### Current Implementation:

Step 1-6 are complete. Step 7 (actual upload interface on case page) will be the next phase.

---

## 📊 Data Fetching

### Server-Side Query

Fetches disputes where:
- `userId` matches current user
- `lifecycleStatus` is NOT "CLOSED"

**Includes:**
- Basic case info (id, title, type, status, createdAt)
- Strategy info (disputeType, evidenceMentioned)
- Document plan (documents and statuses)
- `strategyLocked` flag

**Ordered by:** `updatedAt DESC` (most recently updated first)

---

## 🎯 Smart Features

### Only Active Cases
- Filters out CLOSED cases
- No point uploading evidence to closed cases
- Keeps list relevant

### Evidence Count Display
- Shows existing evidence count
- Helps users see which cases need more evidence
- Visual feedback with green badge

### Strategy Awareness
- Shows "AI Ready" badge if strategy is locked
- Helps users understand case status
- Indicates AI has processed the case

### Search Functionality
- Searches case title
- Searches case type
- Real-time filtering
- Clear search button

---

## 🔗 Integration

### Dashboard Link Updated

**"Upload Evidence" card now navigates to:**
- `/upload-evidence` (instead of `/disputes/start?tab=evidence`)

### Navigation Flow

**From dashboard:**
1. Click "Upload Evidence" → `/upload-evidence`
2. Select case → `/disputes/[id]/case?upload=true`

**The `?upload=true` parameter will be used in the case page to:**
- Show upload interface
- Focus on evidence section
- Provide upload dropzone

---

## 📱 Responsive Design

### Desktop (lg+)
- 3-column case grid
- 4-column file type cards
- Full-width search

### Tablet (md)
- 2-column case grid
- 2-column file type cards
- Full-width search

### Mobile
- 1-column everything
- Stacked cards
- Touch-friendly buttons

---

## 🎨 Visual Elements

### File Type Cards
- Icon with gradient background
- Title and description
- Compact layout
- Glass morphism

### Case Cards
- Glass morphism background
- Gradient overlay on hover
- Multiple badges
- Truncated text
- Arrow animation

### Search Bar
- Large size (h-14)
- Icon prefix
- Glass background
- Focus effects

---

## ✅ COMPLETE

The Upload Evidence page is now functional with:
- ✅ **Case selection interface** with searchable cards
- ✅ **File type information** for supported formats
- ✅ **Search functionality** to find cases
- ✅ **Evidence guidelines** for users
- ✅ **Smart filtering** (only active cases)
- ✅ **Evidence count display** per case
- ✅ **Status badges** for each case
- ✅ **Empty states** for no cases/no results
- ✅ **Dashboard integration** complete
- ✅ **Responsive design** for all devices

**Users can now select which case they want to add evidence to before uploading!** 📤✨

**Next step:** Implement the actual upload interface on the case page when `?upload=true` parameter is present.
