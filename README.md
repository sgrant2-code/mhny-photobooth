# FourFrame Photo Booth

A phone-first Next.js photo booth that takes four front-camera photos, turns them into one photo strip, and lets people save or share the result.

## Run it locally

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL printed in the terminal. Camera access works on `localhost`; when testing from another phone, use HTTPS.

## Use it on an iPhone

Open the site in Safari, tap the Share button, and choose **Add to Home Screen**. The manifest and Apple web-app settings let it launch in its own standalone window.

If camera access was denied, open Safari’s **aA** menu, select **Website Settings**, and allow Camera.
