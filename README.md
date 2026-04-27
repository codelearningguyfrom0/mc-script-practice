# MC script pronunciation practice

Next.js app: upload `.docx` or `.xlsx` MC scripts, hear neural TTS, then record for Azure Speech pronunciation assessment (English, Mandarin, Cantonese).

## Setup

1. Create an [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech) resource.
2. Copy `.env.example` to `.env.local` and set:

   - `AZURE_SPEECH_KEY` — key1 from the Azure portal  
   - `AZURE_SPEECH_REGION` — e.g. `eastasia` (must match the resource region)

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **HTTPS** in production (required for microphone on phones).

## Project location

The app lives in `mc-script-practice/` (parent folder name is not npm-valid for `create-next-app`).
