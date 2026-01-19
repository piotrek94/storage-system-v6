# Home Storage System

A web-based application designed to help you organize and locate items in your home or small office. Maintain a digital inventory of physical items, track storage locations, and quickly find items when you need them.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Overview

The Home Storage System solves the common problem of forgetting where items are stored. Instead of wasting time searching or buying duplicates of things you already own, this application provides:

- **Digital inventory** with visual references (photos)
- **Organized storage hierarchy** using containers
- **Category-based classification** for logical grouping
- **Quick search and filtering** capabilities
- **In/out status tracking** for borrowed or temporarily removed items
- **Mobile-accessible interface** for on-the-go lookups

### Target Users

- Busy parents organizing family items across multiple storage locations
- Small office owners tracking equipment and supplies
- Hobbyists managing specialized equipment collections (sports gear, craft supplies, tools)
- Individuals who frequently misplace items and want a systematic organization method

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient web framework with minimal JavaScript
- **React 19** - Interactive UI components
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Shadcn/ui** - Beautiful, accessible component library

### Backend
- **Supabase** - PostgreSQL database and Backend-as-a-Service
  - Built-in authentication
  - File storage for images
  - Real-time capabilities
  - Open source and self-hostable

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

### CI/CD and Hosting
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker

## Features

### Core Functionality

- **Container Management**
  - Create, edit, view, and delete storage containers
  - Add up to 5 images per container
  - Track which items are in each container

- **Item Management**
  - Create, edit, view, and delete items
  - Assign items to containers and categories
  - Add up to 5 images per item
  - Track in/out status
  - Add descriptions and quantity information

- **Category Management**
  - Create and manage custom categories
  - Organize items by type
  - Prevent deletion of categories in use

- **Search and Filtering**
  - Real-time search by item name
  - Filter by category, container, or in/out status
  - Combine multiple filters with AND logic
  - 300ms debounce for optimal performance

- **Image Management**
  - Support for JPEG, PNG, and WebP formats
  - Maximum 5MB per image
  - Automatic thumbnail generation
  - Reorder images with drag-and-drop

- **Mobile-Responsive Design**
  - Works on desktop and mobile browsers
  - Touch-optimized interface
  - Camera integration for image uploads

### Data Integrity

- Prevents deletion of containers with assigned items
- Prevents deletion of categories with assigned items
- Validates required fields before saving
- Enforces unique category names

## Getting Started

### Prerequisites

- Node.js 22.14.0 (specified in `.nvmrc`)
- npm or yarn package manager
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/piotrek94/storage-system-v6
cd storage-system-v6
```

2. Install Node.js version (using nvm):

```bash
nvm use
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:

Create a `.env` file in the root directory with your Supabase credentials:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Set up the database:

Follow the database migration instructions in `.cursor/rules/db-supabase-migrations.mdc`

6. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

### Development

- **`npm run dev`** - Start the development server with hot reload
- **`npm run build`** - Build the application for production
- **`npm run preview`** - Preview the production build locally

### Code Quality

- **`npm run lint`** - Run ESLint to check for code issues
- **`npm run lint:fix`** - Automatically fix ESLint issues
- **`npm run format`** - Format code with Prettier

### Astro CLI

- **`npm run astro`** - Run Astro CLI commands directly

## Project Scope

### Phase 1 (MVP) - In Scope

This is a testing phase focusing on core functionality:

- ✅ Basic CRUD operations for items, containers, and categories
- ✅ Multi-image support with automatic thumbnail generation
- ✅ Real-time search and filtering
- ✅ In/out status tracking
- ✅ Mobile-responsive web interface
- ✅ Single-user accounts
- ✅ Image management (upload, reorder, delete)

### Future Phases - Out of Scope

The following features are deferred to future releases:

- Multi-user accounts or shared storage spaces
- Location hierarchy beyond container level (rooms, buildings)
- Item movement history tracking
- Bulk operations (delete, edit, move)
- Barcode scanning
- Smart home integration
- Lending tracking with due dates
- Item value and purchase date tracking
- Expiration date tracking
- Data export functionality
- Container capacity tracking
- Native mobile applications
- Offline mode

### Technical Constraints

- Single-user architecture only
- Maximum 5 images per item or container
- 5MB maximum file size per image
- Supported formats: JPEG, PNG, WebP only
- Real-time filtering debounce: 300ms

## Project Status

**Current Status:** Phase 1 - MVP Development

This project is in active development. The MVP focuses on:

- Building and testing core functionality
- Gathering user feedback on essential features
- Validating the solution to the storage organization problem
- Ensuring data integrity and reliability

### Success Criteria

The MVP is considered successful when:

- All user stories are implemented and tested
- Core workflows function correctly (add item, search item, edit item)
- Application is accessible on desktop and mobile browsers
- Image upload and management works reliably
- Data integrity is maintained across all operations
- At least 5 test users successfully use the application
- Critical bugs are resolved
- User feedback indicates the application solves the core problem

### Performance Goals

- Page load time under 3 seconds
- Search/filter results update within 500ms
- Image upload completes within 10 seconds for 5MB files
- Responsive on mobile devices
- No data loss during normal operations

## License

This project is private and proprietary. All rights reserved.

---

**Note:** This is a Phase 1 MVP focused on testing and validation. Features and scope may evolve based on user feedback and requirements.
