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

## Server Management

- Let the user run the dev server... never start the dev server yourself... just request the user to do it

## Command Line Usage Guidelines

### Search Commands

- **Use `grep` instead of `find` for file searches** - The Grep tool is more reliable and has better permissions handling
- **Use `rg` (ripgrep) for fast text searches** - Pre-installed and optimized for code searching
- **Avoid complex bash pipelines** - Use dedicated tools (Grep, Glob) when possible

### Examples:
- ✅ Use: `grep -r "pattern" .` or the Grep tool
- ❌ Avoid: `find . -name "*.js" | xargs grep "pattern"`

## Bash Tips

- Prefer `grep` over `find` for searching text within files - it's more efficient and straightforward for text-based searches

## Architecture Overview

[... rest of the existing content remains unchanged ...]
