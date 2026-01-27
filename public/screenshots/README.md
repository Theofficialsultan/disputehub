# PWA Screenshots

Place app screenshots here for the install prompt and app stores.

## Recommended Sizes

**Mobile (Portrait):**
- 750x1334px (iPhone 8)
- 1080x1920px (Android)

**Desktop (Landscape):**
- 1920x1080px

## Guidelines

- Show actual app UI
- Use high-quality screenshots
- Include 3-5 key screens
- Reference in manifest.json when ready

## Adding to Manifest

Update `/public/manifest.json`:

```json
"screenshots": [
  {
    "src": "/screenshots/screen-1.png",
    "sizes": "1080x1920",
    "type": "image/png",
    "form_factor": "narrow"
  }
]
```
