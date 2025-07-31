# TapTime Games - Gaming Website

## Overview

TapTime Games is a modern web application built for lightweight, browser-based gaming experiences. The application features a collection of simple yet engaging games designed for quick entertainment sessions, with a focus on minimal memory usage and fast loading times.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **UI Components**: Radix UI primitives with custom styling

The frontend follows a modern React architecture with functional components and hooks. The application uses a component-based structure with reusable UI components and game-specific modules.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Development**: Hot module replacement via Vite integration
- **Storage**: In-memory storage with interface for future database integration

The backend implements a simple Express server with TypeScript, providing RESTful endpoints for games, scores, and challenges. The architecture is designed to be easily extensible with database integration.

### Data Storage Solutions
- **Current**: In-memory storage using Maps for development
- **Database**: Drizzle ORM configured for PostgreSQL (ready for production)
- **Schema**: Well-defined database schema with users, games, scores, and challenges tables
- **Migration**: Drizzle Kit for database migrations

The application is currently using in-memory storage for development but has a complete database schema ready for PostgreSQL deployment.

## Key Components

### Game Engine
- **Architecture**: Abstract base class for consistent game development
- **Canvas-based**: HTML5 Canvas for game rendering
- **Event System**: Unified input handling for mouse, touch, and keyboard
- **Game Loop**: Optimized rendering loop with proper timing
- **State Management**: Centralized game state management

### UI Components
- **Design System**: shadcn/ui components with custom gaming theme
- **Responsive**: Mobile-first design with touch support
- **Accessibility**: ARIA labels and keyboard navigation
- **Theme Support**: Light/dark mode toggle

### Game Collection
The application includes several lightweight games:
- **Bottle Flip 2D**: Physics-based timing game
- **Color Trap**: Fast-paced color matching
- **Traffic Tapper**: Traffic management puzzle
- **Paper Plane Flight**: Endless flying game
- **Tap Snake**: Single-tap snake variation
- **Doodle Stack**: Block stacking challenge

## Data Flow

### Client-Server Communication
1. **API Queries**: TanStack Query handles all server communication
2. **Game Data**: Scores and game metadata synchronized with backend
3. **Real-time Updates**: Leaderboards and challenges updated automatically
4. **Local Storage**: User preferences and offline game data cached locally

### Game State Management
1. **Game Engine**: Each game extends the base GameEngine class
2. **Score Tracking**: Real-time score updates with callback system
3. **Local Persistence**: Game progress saved to localStorage
4. **Server Sync**: High scores submitted to backend API

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Query
- **Routing**: Wouter for lightweight routing
- **Styling**: Tailwind CSS, Radix UI components
- **Build Tools**: Vite, TypeScript, PostCSS

### Database & Backend
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Driver**: Neon Database serverless PostgreSQL
- **Validation**: Zod for schema validation
- **Session Management**: Ready for PostgreSQL session storage

### Development Tools
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint configuration ready
- **Development Experience**: Vite dev server with HMR

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Reloading**: Both frontend and backend support hot module replacement
- **Database**: In-memory storage for rapid development
- **Environment Variables**: DATABASE_URL configuration for production

### Production Deployment
- **Build Process**: Vite builds optimized frontend bundle
- **Backend Compilation**: esbuild bundles Express server
- **Static Assets**: Frontend served from Express in production
- **Database**: PostgreSQL via Neon Database (configured but not yet implemented)
- **Environment**: NODE_ENV-based configuration

### Key Architectural Decisions

1. **Monorepo Structure**: Frontend, backend, and shared code in single repository for easier development and deployment
2. **TypeScript Throughout**: Full type safety across the entire stack
3. **Lightweight Games**: Focus on canvas-based games that load quickly and use minimal resources
4. **Progressive Enhancement**: Games work on both desktop and mobile with appropriate input methods
5. **Scalable Storage**: In-memory storage for development with easy migration path to PostgreSQL
6. **Component Reusability**: Shared UI components and game engine base class for consistent development patterns

The architecture prioritizes rapid development, type safety, and scalability while maintaining focus on the core gaming experience.
