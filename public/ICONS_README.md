# PWA ICONS NEEDED

To complete the PWA setup, you need to add the following image files to the `/public` directory:

## Required Icons

1. **icon-192.png** (192x192px)
   - Standard app icon for mobile devices
   - Should be your DisputeHub logo on a solid background

2. **icon-512.png** (512x512px)
   - High-resolution app icon
   - Same design as 192px, just larger

3. **icon-shortcut-new.png** (96x96px)
   - Icon for "New Dispute" shortcut
   - Suggested: Plus (+) symbol

4. **icon-shortcut-cases.png** (96x96px)
   - Icon for "My Cases" shortcut
   - Suggested: Document/folder symbol

5. **screenshot-mobile.png** (390x844px)
   - Screenshot of the mobile app view
   - Shows dashboard or case view

6. **screenshot-desktop.png** (1920x1080px)
   - Screenshot of the desktop web view
   - Shows full dashboard layout

## Quick Way to Generate Icons

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or create them manually with your logo/branding.

## Temporary Solution

For now, the manifest.json references these files, but they won't break the app if missing.
The PWA features will work, just without custom icons.
