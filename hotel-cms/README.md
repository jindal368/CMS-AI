# Hotel CMS

AI-powered hotel content management system built with Next.js, Prisma, and a 4-tier LLM routing architecture.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- [OpenRouter API key](https://openrouter.ai/keys) (for AI features)

## Setup

1. **Install dependencies**

   ```bash
   cd hotel-cms
   npm install
   ```

2. **Configure environment variables**

   Create a `.env` file in the `hotel-cms` directory:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/hotel_cms"
   OPENROUTER_API_KEY="your-openrouter-api-key"
   ```

3. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Seed the database** (optional)

   ```bash
   npx prisma db seed
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
