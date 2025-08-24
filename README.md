# Loyverse Menu Display

A web application that displays Loyverse menu items with API integration.

## Features

- Real-time menu display from Loyverse API
- Category-based organization
- Item variants and modifiers support
- Responsive design
- API proxy endpoints for Loyverse data

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `env.example` to `.env`
   - Add your Loyverse API token to `LOYVERSE_API_TOKEN`

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Vercel Deployment

### Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)

### Deployment Steps

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Deploy to Vercel**:
```bash
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings in Vercel
   - Add environment variable: `LOYVERSE_API_TOKEN` with your Loyverse API token

4. **Redeploy** (if you added environment variables after first deploy):
```bash
vercel --prod
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LOYVERSE_API_TOKEN` | Your Loyverse API token | Yes |
| `PORT` | Server port (auto-set by Vercel) | No |

## API Endpoints

- `/api/loyverse-data` - Comprehensive data from all endpoints
- `/api/loyverse-modifiers` - Modifiers only
- `/api/loyverse-modifier-groups` - Modifier groups
- `/api/loyverse-variants` - Items with variants
- `/api/loyverse/:endpoint` - Generic proxy for any Loyverse endpoint

## Project Structure

```
loyverse/
├── server.js          # Express server with API endpoints
├── index.html         # Main menu display page
├── loyverse-data.html # Data display page
├── api-test.html      # API testing page
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies and scripts
└── env.example        # Environment variables template
```

## Technologies Used

- Node.js
- Express.js
- Loyverse API
- HTML/CSS/JavaScript
- Vercel (deployment)

