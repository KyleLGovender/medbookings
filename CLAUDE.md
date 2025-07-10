# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Prisma generate)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests

### Database Operations

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database (development)
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open database GUI
- `npx prisma db seed` - Seed database with sample data

### Docker Development

- `docker compose up` - Start PostgreSQL database locally

## Development Workflow

### Task Completion Reporting

- Always display a list of files that were modified once a task is complete explaining briefly what was modified in each file

## Architecture Overview

[... rest of the existing content remains unchanged ...]