# AI Setup Guide - Quick Start

## Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

## Step 2: Configure Environment

Open `.env` and replace the placeholder:

```bash
# Replace this line:
OPENAI_API_KEY=sk-your-openai-api-key-here

# With your actual key:
OPENAI_API_KEY=sk-proj-abc123...
```

## Step 3: Test the Integration

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Create a test dispute**:
   - Go to http://localhost:3000/disputes/new
   - Fill in the wizard with test data
   - Submit the dispute

3. **Verify AI generation**:
   - The preview should generate automatically
   - Check the summary is contextual (not generic)
   - Key points should relate to your description
   - Strength assessment should make sense

## What's Different Now?

### Before (Mock AI)
- Generic templates based on dispute type
- Same key points for all disputes of same type
- No actual analysis of description

### After (Real AI)
- Contextual analysis of your specific case
- Key points extracted from your description
- Strength based on actual case details
- Preview lines from real letter generation

## Cost Monitoring

### Check Usage
- Dashboard: https://platform.openai.com/usage
- Model: gpt-4o-mini
- Typical cost: £0.001-0.002 per preview

### Set Limits (Recommended)
1. Go to https://platform.openai.com/settings/organization/limits
2. Set a monthly budget (e.g., £10)
3. Enable email alerts

## Troubleshooting

### Error: "No response from AI"
- Check API key is correct in `.env`
- Verify you have credits in OpenAI account
- Check terminal for detailed error logs

### Error: "Rate limit exceeded"
- You've hit OpenAI's rate limit
- Wait a few seconds and try again
- Consider upgrading your OpenAI tier

### Fallback Behavior
If AI fails for any reason:
- System automatically uses fallback preview
- User still gets a preview (just less personalized)
- Error logged to console for debugging

## API Key Security

✅ **DO:**
- Keep API key in `.env` file
- Add `.env` to `.gitignore`
- Use different keys for dev/production

❌ **DON'T:**
- Commit API keys to git
- Share keys publicly
- Use production keys in development

## Next Steps

Once this is working:
1. Test with different dispute types
2. Try various description lengths
3. Monitor costs in OpenAI dashboard
4. Plan for Phase 6 (full letter generation post-unlock)

## Support

- OpenAI Docs: https://platform.openai.com/docs
- API Status: https://status.openai.com
- Pricing: https://openai.com/api/pricing
