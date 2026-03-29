<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ad499643-ed62-4f12-8a59-9dcb07241493

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `VITE_GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optional: set `VITE_GEMINI_MODELS` in [.env.local](.env.local) to a comma-separated fallback list, for example `gemini-2.5-flash,gemini-3-flash-preview`
4. Optional: set `VITE_GEMINI_MAX_RETRIES` (recommended `1` or `2`) for faster responses under load
5. Run the app:
   `npm run dev`
