# MedBookings Codebase Documentation

Welcome to the comprehensive MedBookings codebase documentation! This documentation is designed for new developers to understand exactly how everything in the codebase works, its structure, and the reasoning behind every architectural decision.

## 📋 Table of Contents

### Core Architecture & Patterns
- [🏗️ Core Architecture Overview](./core/architecture-overview.md) - High-level system design and patterns
- [🗂️ Project Structure Deep Dive](./core/project-structure-explained.md) - Detailed breakdown of folder organization
- [🔄 Data Flow Architecture](./core/data-flow-patterns.md) - How data moves through the system
- [🎯 Type System Architecture](./core/type-system-guide.md) - TypeScript patterns and conventions

### Next.js App Router System
- [🚀 App Router Architecture](./nextjs/app-router-structure.md) - How Next.js App Router is organized
- [📄 Page & Layout System](./nextjs/pages-and-layouts.md) - Page components and layout hierarchy
- [🔒 Route Groups & Protection](./nextjs/route-groups-explained.md) - Authentication and route organization
- [⚡ Server vs Client Components](./nextjs/server-client-patterns.md) - Component rendering patterns

### Feature Module System
- [📦 Feature Architecture](./features/feature-module-pattern.md) - How features are organized
- [🏥 Admin Feature](./features/admin-feature.md) - Administrative functionality
- [👤 Authentication Feature](./features/auth-feature.md) - User authentication system
- [🏢 Organizations Feature](./features/organizations-feature.md) - Organization management
- [👨‍⚕️ Providers Feature](./features/providers-feature.md) - Healthcare provider management  
- [📅 Calendar Feature](./features/calendar-feature.md) - Booking and availability system
- [💰 Billing Feature](./features/billing-feature.md) - Subscription and payment system
- [💬 Communications Feature](./features/communications-feature.md) - Notifications and messaging

### Database & Data Layer
- [🗃️ Prisma Schema Deep Dive](./database/prisma-schema-explained.md) - Database structure and relationships
- [🔗 Database Relationships](./database/entity-relationships.md) - How entities connect
- [📊 Data Models & Business Logic](./database/data-models-guide.md) - Understanding business rules
- [🔄 Database Migrations](./database/migration-patterns.md) - Schema evolution strategy

### API Architecture
- [🌐 tRPC Integration](./api/trpc-architecture.md) - Type-safe API layer
- [🛣️ API Route Patterns](./api/route-patterns.md) - REST endpoint organization
- [🔐 Authentication & Authorization](./api/auth-patterns.md) - Security implementation
- [❌ Error Handling](./api/error-handling.md) - Error management strategies

### Component Architecture
- [🧩 Component Patterns](./components/component-patterns.md) - Reusable component design
- [🎨 UI Component System](./components/ui-components.md) - Base component library
- [📋 Form Architecture](./components/form-patterns.md) - Form handling and validation
- [🎭 State Management](./components/state-patterns.md) - Client state handling

### Development Workflow
- [⚡ Development Workflow](./workflow/development-process.md) - How to develop new features
- [🔧 Technical Planning System](./workflow/technical-planning.md) - Planning methodology
- [📝 Code Standards](./workflow/coding-standards.md) - Style and quality guidelines
- [🧪 Testing Strategy](./workflow/testing-patterns.md) - Testing approaches

### Integrations & External Services
- [🔗 Google Calendar Integration](./integrations/google-calendar.md) - Calendar sync architecture
- [📧 Communications Stack](./integrations/communications.md) - Email, SMS, WhatsApp
- [📁 File Upload System](./integrations/file-uploads.md) - Document handling
- [🗺️ Google Maps Integration](./integrations/google-maps.md) - Location services

### Security & Performance
- [🛡️ Security Architecture](./security/security-patterns.md) - Security implementation
- [⚡ Performance Optimization](./performance/optimization-guide.md) - Performance strategies
- [🔍 Monitoring & Debugging](./monitoring/debugging-guide.md) - Troubleshooting tools

## 🎯 Quick Start Guide

### For New Developers

1. **Start Here**: [Core Architecture Overview](./core/architecture-overview.md) - Understand the big picture
2. **Project Structure**: [Project Structure Deep Dive](./core/project-structure-explained.md) - Learn how code is organized
3. **Feature Focus**: Pick a feature from [Feature Architecture](./features/feature-module-pattern.md) that interests you
4. **Hands-On**: Follow [Development Workflow](./workflow/development-process.md) to make your first change

### For Specific Tasks

| If you want to... | Read this... |
|-------------------|--------------|
| Add a new page | [App Router Architecture](./nextjs/app-router-structure.md) |
| Create a new feature | [Feature Module Pattern](./features/feature-module-pattern.md) |
| Modify the database | [Prisma Schema Deep Dive](./database/prisma-schema-explained.md) |
| Add an API endpoint | [tRPC Architecture](./api/trpc-architecture.md) |
| Create a new component | [Component Patterns](./components/component-patterns.md) |
| Understand authentication | [Authentication Feature](./features/auth-feature.md) |
| Work with forms | [Form Architecture](./components/form-patterns.md) |
| Debug an issue | [Monitoring & Debugging](./monitoring/debugging-guide.md) |

## 🧭 Navigation Tips

### Understanding Connections
- **🔗 Cross-references**: Look for links between documents to understand relationships
- **📊 Diagrams**: Visual representations show architecture and data flow
- **💡 Code Examples**: Real code snippets from the actual codebase
- **⚠️ Important Notes**: Key gotchas and reasoning behind decisions

### Reading Order Recommendations

**Backend Developers**:
1. Core Architecture → Database → API → Features
2. Focus on tRPC and Prisma patterns

**Frontend Developers**:
1. Core Architecture → Next.js → Components → Features  
2. Focus on component patterns and state management

**Full-Stack Developers**:
1. Core Architecture → Project Structure → Pick a feature → Follow its full implementation

## 🔄 Living Documentation

This documentation is maintained alongside the codebase. When code changes, documentation should be updated to reflect:

- New architectural patterns
- Changed business logic
- Updated dependencies
- New development workflows

## ❓ Getting Help

- **Code Questions**: Check the specific feature documentation
- **Architecture Questions**: Start with core architecture docs
- **Workflow Questions**: Review development workflow documentation
- **Missing Documentation**: Create an issue or contribute improvements

---

*This documentation represents the current state of the MedBookings codebase and is continuously updated to reflect the latest architectural decisions and patterns.*