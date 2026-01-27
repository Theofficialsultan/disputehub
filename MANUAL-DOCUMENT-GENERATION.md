# Manual Document Generation Button

## The Problem:
- AI was asking questions endlessly with no clear stopping point
- Automatic decision gate was disabled (because it triggered too early)
- No way for user to control when documents should be generated

## The Solution:
✅ **"Generate Documents" Button** - User-controlled document generation

## How It Works:

### 1. Conversation Phase
- AI asks thorough questions (15-20+ exchanges)
- User provides information and uploads evidence
- **No automatic document generation**

### 2. User Decision
- When user feels ready, they see a prominent button above the chat input
- Button says: **"Generate Documents"**
- Appears in a purple/pink gradient box with explanation text

### 3. Manual Trigger
- User clicks "Generate Documents" when ready
- System calls the decision gate API
- Documents generate in real-time
- UI updates automatically to show progress

## UI Location:

**Button appears above chat input:**
```
┌─────────────────────────────────┐
│  Ready to proceed?              │
│  Generate your legal documents  │
│  [Generate Documents] button    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Chat Input Box                 │
└─────────────────────────────────┘
```

## Button States:

### Before Generation:
- Shows purple/pink gradient button
- Text: "Generate Documents"
- Icon: FileText

### During Generation:
- Shows loading spinner
- Text: "Generating..."
- Button disabled

### After Generation:
- Button disappears
- Shows checkmark badge: "Documents Generated"

## Files Changed:

1. **`src/components/case/GenerateDocumentsButton.tsx`** (NEW)
   - React component for the button
   - Calls `/api/admin/trigger-gate`
   - Shows loading states
   - Toast notifications

2. **`src/app/(dashboard)/disputes/[id]/case/components/CaseChatClient.tsx`**
   - Imports and renders `GenerateDocumentsButton`
   - Positioned above `ChatInput`
   - Only shows when `!strategyLocked`
   - Triggers document refresh on completion

3. **`src/lib/ai/prompts.ts`**
   - Added section about document generation button
   - Instructs AI NOT to mention the button
   - AI just focuses on asking questions

## User Flow:

1. User starts case → AI asks questions
2. User answers and uploads evidence
3. **User decides they're ready** (not AI, not system)
4. User clicks **"Generate Documents"**
5. Documents generate with real-time progress
6. Download buttons appear when ready

## Benefits:

✅ **User Control**: User decides when they're ready
✅ **No AI Confusion**: AI just asks questions, doesn't try to control generation
✅ **Clear Action**: Big obvious button when ready
✅ **No Premature Generation**: Documents only generate when user wants
✅ **Better UX**: User is in control of the workflow

---

**The system is now fully user-controlled. Documents generate when YOU say so, not when AI thinks it's ready!** 🎉
