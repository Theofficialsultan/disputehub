# PWA Icons

Place your app icons here in the following sizes:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can use tools like:
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

Or generate from a single source image:

```bash
npx pwa-asset-generator source-logo.svg public/icons --icon-only
```

Icons should be maskable (safe zone with 20% padding) for best results across all platforms.
