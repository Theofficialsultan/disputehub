# Quick Start - Real AI Preview

## 🚀 Get Started in 3 Steps

### 1️⃣ Get OpenAI API Key (2 minutes)
```
1. Visit: https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click "Create new secret key"
4. Copy the key (starts with sk-)
```

### 2️⃣ Add to Environment (30 seconds)
```bash
# Open .env file and replace:
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3️⃣ Test It (1 minute)
```bash
# Server should already be running
# If not: npm run dev

# Then:
1. Go to http://localhost:3000/disputes/new
2. Fill in dispute details
3. Submit and view AI preview
```

## ✅ What's Working Now

- **Real AI Analysis** - Contextual, intelligent previews
- **Cost Controlled** - ~£0.002 per preview
- **Same UI** - No changes to user experience
- **Fallback Safe** - Works even if AI fails

## 📊 What You'll See

### Before (Mock)
- Generic templates
- Same key points for all disputes of same type

### After (Real AI)
- Specific analysis of your case
- Key points extracted from your description
- Strength based on actual details

## 💰 Cost Estimate

- **Per preview**: £0.001-0.002
- **100 previews**: £0.15
- **1000 previews**: £1.50

Very affordable for testing!

## 🔍 Verify It's Working

**Good signs:**
- Summary mentions specific details from your description
- Key points are unique to your case
- Strength assessment makes sense

**If it's not working:**
- Check API key is correct in `.env`
- Verify OpenAI account has credits
- Look for errors in terminal

## 📚 Full Documentation

- **Setup Guide**: `AI_SETUP_GUIDE.md`
- **Implementation**: `PHASE5_IMPLEMENTATION.md`
- **Summary**: `PHASE5_SUMMARY.md`
- **Prompt Strategy**: `docs/AI_PROMPT_STRATEGY.md`

## 🎯 Next Phase

Phase 6 will add:
- Full letter generation (after payment)
- Evidence file analysis
- Legal precedent matching
- Enhanced scoring

---

**Ready?** Add your API key and test it now! 🚀
