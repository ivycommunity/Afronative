# NativeLab - Duolingo Clone

A React Native implementation of a Duolingo-like language learning application using Expo Router and Firebase.

## Project Structure

```
app/
  ├── _layout.tsx              # Root layout with navigation setup
  ├── index.tsx                # Initial landing/splash screen
  ├── auth/                    # Authentication flows
  │   ├── _layout.tsx          # Auth navigation layout
  │   ├── sign-in.tsx          # Sign in screen
  │   ├── sign-up.tsx          # Sign up screen
  │   └── onboarding.tsx       # Language selection & initial setup
  ├── home/                    # Main app screens
  │   ├── _layout.tsx          # Tab navigation layout
  │   ├── _games.tsx           # 
  │   ├── _quiz.tsx            # 
  │   └── index.tsx            # Home dashboard with lessons
  ├── lessons/                 # Lesson-related screens
  │   ├── _layout.tsx          # Lessons navigation layout
  │   ├── videos.tsx           # 
  │   ├── speaking.tsx         # 
  │   ├── listening.tsx        # 
  │   ├── writing.tsx          # 
  │   ├── lessonid.tsx         # 
  │   └── complete.tsx         # Lesson completion screen
  ├── practice/                # Practice mode screens
  │   ├── _layout.tsx          # Practice navigation layout
  │   ├── _speaking.tsx        #
  │   ├── _writing.tsx         #
  │   ├── _pronunciation.tsx   #
  │   └── index.tsx            # Practice selection/dashboard
  ├── profile/                 # User profile screens
  │   ├── _layout.tsx          # Profile navigation layout
  │   ├── index.tsx            # Main profile screen
  │   ├── stats.tsx            # Learning statistics
  │   └── settings.tsx         # User settings
  └── leaderboard/             # Leaderboard and social features
      ├── _layout.tsx          # Leaderboard navigation layout
      └── index.tsx            # Leaderboard screen

firebase/
  ├── config/
  │   └── firebase.config.ts    # Firebase configuration
  ├── auth/
  │   ├── types.ts              # Auth-related types
  │   └── auth.ts               # Auth methods
  ├── firestore/
  │   ├── types.ts              # Firestore types
  │   ├── users.ts              # User-related operations
  │   ├── lessons.ts            # Lesson-related operations
  │   ├── progress.ts           # Progress tracking operations
  │   └── leaderboard.ts        # Leaderboard operations
  └── storage/
      ├── assets.ts             # Storage operations for lesson assets
      └── contentfulClient.ts   # 

components/
  ├── auth/                     # Auth-related components
  ├── lessons/                  # Lesson-specific components
  ├── practice/                # Practice components
  ├── shared/                   # Shared/common components
  └── ui/                       # Basic UI components

constants/
  ├── colors.ts                 # Color definitions
  ├── typography.ts             # Typography styles
  ├── layout.ts                 # Layout constants
  └── config.ts                 # App configuration

hooks/
  ├── useAuth.ts                # Authentication hooks
  ├── useLesson.ts              # Lesson-related hooks
  ├── useProgress.ts            # Progress tracking hooks
  └── useLeaderboard.ts         # Leaderboard hooks

types/
  ├── auth.types.ts             # Authentication types
  ├── lesson.types.ts           # Lesson-related types
  ├── user.types.ts             # User-related types
  └── api.types.ts              # API-related types

utils/
  ├── firebase/                 # Firebase utility functions
  ├── validation/               # Form validation
  ├── formatting/               # Data formatting
  └── analytics/                # Analytics helpers
```

## Tech Stack

- React Native
- Expo Router
- Firebase (Authentication, Firestore, Storage)
- TypeScript

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

## Firebase Setup

1. Create a Firebase project
2. Add your Firebase configuration in `firebase/config/firebase.config.ts`
3. Enable Authentication, Firestore, and Storage in your Firebase console

## Development

- The app uses Expo Router for navigation
- Firebase services are organized by feature in the `firebase` directory
- Reusable components are stored in the `components` directory
- Type definitions are in the `types` directory
- Custom hooks are in the `hooks` directory
- Constants and utilities are organized in their respective directories

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT
