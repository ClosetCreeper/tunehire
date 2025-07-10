# TuneHire - By Undertone

A modern full-stack platform where people can hire musicians to record custom music. Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

## Overview

TuneHire connects music buyers with talented musicians worldwide. Buyers can search for musicians, upload sheet music, set tempo & notes, and pay securely to receive custom audio recordings. Musicians can create profiles, set rates, and earn money by fulfilling orders.

## Features

### 🎵 For Buyers (Clients)
- Search musicians by instrument
- View musician profiles and audio samples
- Upload sheet music (PDF)
- Set tempo (BPM), title, and additional notes
- Secure payment processing
- Real-time messaging with musicians
- Download completed audio recordings
- Rate and review musicians

### 🎼 For Sellers (Musicians)
- Create detailed profiles with bio and instrument
- Set custom rates per minute
- Upload profile images and audio samples
- Manage availability status
- Accept/decline orders
- Upload completed recordings
- Message with buyers
- Track earnings and reviews

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (Email/Password + Google OAuth)
- **File Storage**: UploadThing (images, audio, PDFs)
- **Payment Processing**: Stripe (ready to integrate)
- **Icons**: Lucide React

## Project Structure

```
tunehire/
├── src/
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/           # Authentication
│   │   │   ├── users/          # User management
│   │   │   ├── profiles/       # Musician profiles
│   │   │   ├── orders/         # Order management
│   │   │   ├── messages/       # Messaging system
│   │   │   └── uploadthing/    # File uploads
│   │   ├── auth/               # Auth pages
│   │   ├── search/             # Search musicians
│   │   ├── hire/               # Place orders
│   │   ├── dashboard/          # User dashboard
│   │   ├── profile/            # Musician profile
│   │   └── page.tsx            # Homepage
│   ├── components/
│   │   ├── Navigation.tsx      # Main navigation
│   │   └── providers/          # Context providers
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Database client
│   │   └── uploadthing.ts     # File upload utilities
│   └── types/
│       └── next-auth.d.ts     # Type definitions
├── prisma/
│   └── schema.prisma          # Database schema
├── .env                       # Environment variables
└── package.json
```

## Database Schema

### Core Models
- **User**: Authentication and basic user info
- **Profile**: Musician profiles with bio, instrument, rates
- **Order**: Custom music orders with details and status
- **Message**: Real-time messaging between users
- **Review**: Rating and review system

### Relationships
- Users can have one Profile (for musicians)
- Users can have many Orders (as buyer or seller)
- Orders can have many Messages
- Orders can have one Review

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- UploadThing account
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd tunehire
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env` file with the following variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tunehire"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

4. **Database Setup**
```bash
# Start Prisma database (if using local)
npx prisma dev

# Or run migrations
npx prisma migrate dev
npx prisma generate
```

5. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `POST /api/users` - Create user

### Profiles
- `GET /api/profiles` - Get all profiles (with search)
- `POST /api/profiles` - Create/update profile

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order status

### Messages
- `POST /api/messages` - Send message

### File Uploads
- `POST /api/uploadthing` - Upload files (images, audio, PDFs)

## Key Features Implemented

### ✅ Completed Features
- User authentication (email/password + Google OAuth)
- Musician profile creation and management
- Search and filter musicians by instrument
- Order placement with file upload
- Real-time messaging system
- Order status tracking
- File upload system for sheet music and audio
- Responsive design with Tailwind CSS
- Dashboard for order management

### 🚧 Pending Features
- Stripe payment integration
- Rating and review system
- Email notifications
- Advanced search filters
- Calendar availability
- Mobile app optimization

## File Upload System

The application uses UploadThing for secure file uploads:
- **Sheet Music**: PDF files up to 4MB
- **Audio Files**: Audio recordings up to 16MB
- **Profile Images**: Images up to 4MB

## Security Features

- JWT-based authentication
- Protected API routes
- File upload validation
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

## Deployment

### Prerequisites for Production
1. PostgreSQL database (Railway, Supabase, etc.)
2. UploadThing account for file storage
3. Stripe account for payments
4. Vercel/Netlify for hosting

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="secure-random-secret"
GOOGLE_CLIENT_ID="production-google-client-id"
GOOGLE_CLIENT_SECRET="production-google-client-secret"
UPLOADTHING_SECRET="production-uploadthing-secret"
UPLOADTHING_APP_ID="production-uploadthing-app-id"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or support, please contact the development team.

---

**TuneHire - By Undertone** - Connecting musicians with clients worldwide 🎵
