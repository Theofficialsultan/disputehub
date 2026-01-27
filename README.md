# DisputeHub

A mobile-first PWA for dispute resolution, built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Clerk
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **PWA:** next-pwa
- **Hosting:** Vercel

## Prerequisites

- Node.js 18+ and npm
- Clerk account ([clerk.com](https://clerk.com))
- Supabase account ([supabase.com](https://supabase.com))

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

- **Clerk:** Get keys from [Clerk Dashboard](https://dashboard.clerk.com)
- **Supabase:** Get connection string from [Supabase Dashboard](https://supabase.com/dashboard)

### 3. Database Setup

Initialize Prisma and run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
disputehub/
├── prisma/              # Database schema
├── public/              # Static assets & PWA manifest
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # Authentication routes
│   │   ├── (dashboard)/ # Protected routes
│   │   └── api/         # API routes
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── features/    # Feature components
│   │   ├── layouts/     # Layout components
│   │   └── shared/      # Shared components
│   ├── lib/             # Utilities & helpers
│   │   ├── api/         # API client
│   │   ├── hooks/       # Custom hooks
│   │   └── validations/ # Zod schemas
│   ├── types/           # TypeScript types
│   └── config/          # Configuration files
└── ...config files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)

## PWA Features

- **Installable:** Add to home screen on iOS/Android
- **Offline Support:** Service worker caching
- **Mobile-First:** Optimized for touch and small screens
- **App-Like:** Standalone display mode (no browser UI)

### Testing PWA

1. Build the app: `npm run build`
2. Start production server: `npm run start`
3. Open in Chrome/Edge and check the install prompt
4. For iOS: Use Safari and "Add to Home Screen"

## Development Guidelines

- **Mobile-First:** Design for small screens first
- **Type Safety:** Use TypeScript strictly
- **Component Isolation:** Keep components focused
- **API Routes:** Backend logic in Next.js API routes
- **Validation:** Use Zod for all form/data validation

## Database Migrations

When you modify `prisma/schema.prisma`:

```bash
# Development
npx prisma db push

# Production (with migrations)
npx prisma migrate dev --name your_migration_name
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables Required

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_APP_URL`

## Future: Native Mobile Apps

This architecture supports future native iOS/Android apps via:

- **Expo + React Native:** Reuse types, validation, API client
- **Shared Backend:** API routes serve both web and native
- **Type Sharing:** Export Zod schemas to native codebase

## License

MIT
