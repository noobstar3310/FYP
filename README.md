# DeFi Analytics Platform

A comprehensive DeFi analytics platform that provides insights into wallet activity, DeFi participation, and credit scoring based on on-chain data.

## Features

- **Wallet Age Analysis**: Track when addresses first became active on Ethereum
- **DeFi Participation Analysis**: Analyze DeFi protocol usage and activity
- **Credit Scoring**: Calculate credit scores based on DeFi participation metrics
- **Modern UI**: Clean, Swiss design-inspired interface

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Moralis API for blockchain data
- RainbowKit for wallet connection

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/noobstar3310/FYP.git
cd FYP
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file and add your Moralis API key:
```
NEXT_PUBLIC_MORALIS_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app/` - Next.js pages and layouts
- `/src/app/utils/` - Utility functions and API integrations
- `/src/app/components/` - Reusable React components

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
