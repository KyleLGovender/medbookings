# MedBookings MVP Project Plan

## 🚀 Current Sprint (In Progress)
- [ ] Standardize feature type definitions across bulletproof-react structure - Refactor all features to define types consistently in feature-specific types folders instead of mixed Prisma imports
  - **Type:** Technical Debt
  - **Impact:** Eliminates developer confusion from inconsistent type definitions, prevents circular dependencies, improves maintainability
  - **Files:** All features in `@src/features/` types folders, based on `@prisma/schema.prisma`
  - **Added:** 2025-01-21
- [ ] Implement user roles system (guest, user, provider, organization manager, admin)

## 📋 Ready for Development (Prioritized)

## 🔥 High Priority Issues & Tasks



## 📊 Medium Priority Issues & Tasks
- [ ] Create database view for direct Booking-ServiceProvider relationships - Improve query performance while maintaining data integrity
  - **Type:** Database Performance Optimization
  - **Impact:** Simplifies provider-booking queries without adding redundant foreign keys
  - **Files:** Database schema, potentially new view migrations
  - **Added:** 2025-01-18


## 🧹 Low Priority / Technical Debt


## ✅ Recently Completed

## 📝 Quick Capture (New Issues)
- [ ] Populate provider and organization and user email addresses with the associated Google email. Not possible to edit.
- [ ] Implement testing throughout the application
- [ ] Remove Calendar from Menu based on user logged in
- [ ] Protect Calendar routes based on authentication
- [ ] Review centralized calendar views

---

## 📊 Project Health
- **Total Active Issues**: 10
- **High Priority**: 1
- **Medium Priority**: 6
- **Low Priority**: 1
- **Current Sprint**: 1
- **Ready for Dev**: 0
- **Recently Completed**: 14
- **Last Updated**: 2025-01-21

---

# 📋 MVP Roadmap

## 🎯 MVP Phase 1: Core Platform (Must-Have for Launch)

### Foundation (Get System Working)
- [ ] Fix all build errors and get system building cleanly
- [ ] Remove/clean up non-MVP code to focus on core functionality
- [ ] Implement user roles system (guest, user, provider, organization manager, admin)

### Provider Management (Core)
*Goal: A user can register as a provider and be approved by ADMIN*
- [x] Provider registration flow exists
- [x] Provider profile editing works
- [x] Provider specialization and services selection works

### Organization Management (Core)
*Goal: A user can register an organization, be approved by ADMIN, and invite providers*
- [x] Organization creation interface exists
- [x] Organization profile management works
- [x] Design organization approval workflow for admins
- [x] Build organization-provider invitation system
- [x] Build organization dashboard for managing providers and invitations
- [ ] Define and implement organization roles (owner, manager, member, etc.)

### Admin Dashboard (Core)
*Goal: Admin can approve providers and organizations*
- [x] Create admin dashboard interface
- [x] Implement provider approval management (approve/reject providers)
- [x] Implement organization approval management (approve/reject organizations)
- [ ] Basic user management functionality

## 🚀 MVP Phase 2: Booking System (Core Business Value)

### Availability Management
- [ ] Design provider calendar view
- [ ] Enable provider to create and edit availability
    - [ ] Day, 3 Day, Week and Monthly Views
    - [ ] Well defined availability creation form
    - [ ] Availability Edit form
    - [ ] Ability to interact with availabilities
    - [ ] Availability data structure
        - [ ] Start time and end time
        - [ ] Service types (with price and duration values)
        - [ ] Location and/or online options
        - [ ] Automated confirmation or manual confirmation required
        - [ ] Billing entity rules (organization vs provider billing)
    - [ ] Implement recurring availability patterns
        - [ ] Specify recurrence schedule (weekly, daily, custom)
        - [ ] Generate individual availability occurrences with availability series ID
        - [ ] Enable individual availability changes and series management
- [ ] Availability slot generation and management
  - [ ] Generate availability slots from availability
  - [ ] Manage slot conflicts and overlaps
  - [ ] Handle BOOKED and INVALID slot states

- [ ] Design a user calendar view to see a single providers calendar
    - [ ] Display availability slots with various statuses
    - [ ] Ability to change view by selecting service
    - [ ] URL params to filter the view so that passing a URL can specify which provider for which service and which time frame

- [ ] Design organization calendar view based on patterns from provider availability
    - [ ] View should aggregate overall availability and display per location or online how the overall organization's availability is configured (2 GP's during these hours etc)
    - [ ] Should be possible for an organization role to click on any provider and see their availability configured with the organization
- [ ] Availability proposal form and workflow for organization and provider to accept availability
    - [ ] Either side can propose availability 
    - [ ] Either side can edit a proposal and send it back
    - [ ] If an availability is accepted by the other side it becomes ACCEPTED and thus active

- [ ] Design a user calendar view to see an organization's calendar
    - [ ] Display availability slots with various statuses
    - [ ] Ability to change view by selecting service or provider
    - [ ] URL params to filter the view so that passing a URL can specify which organization and which provider for which service and which time frame


### Booking System
- [ ] Create booking slot generation based on availability
- [ ] Implement booking creation workflow for guests/users
- [ ] Build booking confirmation and notification system
- [ ] Design booking management for providers
- [ ] Implement booking management for organization managers
- [ ] Create booking modification and cancellation flows
- [ ] Build booking history views

### Basic Communications
- [ ] Set up email service integration
- [ ] Create email templates for registration, verification
- [ ] Implement booking confirmation emails
- [ ] Build reminder notification system
- [ ] Create cancellation and modification communications

## 🌟 MVP Phase 3: Enhanced Features & Integrations

### Calendar Integration
- [ ] Research and implement Google Calendar API integration
- [ ] Build OAuth flow for Google Calendar authorization
- [ ] Implement bidirectional sync for provider availability
- [ ] Create bidirectional sync for bookings
- [ ] Handle calendar conflict resolution
- [ ] Implement webhook listeners for external calendar changes
- [ ] Design fallback mechanisms for sync failures

### Enhanced Provider Features
- [ ] Implement Google Calendar connection during provider registration
- [ ] Add Google Meet integration for virtual appointments
- [ ] Set up email sync permissions for notifications
- [ ] Implement provider search and filtering
- [ ] Add profile image upload capability (with option to use Google profile image)

### Enhanced Organization Features
- [ ] Implement organization public profile for guests/users to view
- [ ] Create organization search and filtering
- [ ] Implement location search with geolocation support

### Multi-provider Views & Management
- [ ] Design organization diary views showing multiple providers
- [ ] Implement filtering by provider type/specialization
- [ ] Build time-slot allocation across providers
- [ ] Create resource management functionality
- [ ] Implement team availability visualization

### Enhanced Communications
- [ ] Implement organization invitation emails
- [ ] Design HTML email templates with branding

## 🚀 MVP Phase 4: Advanced Features & Scalability

### WhatsApp Communications
- [ ] Research and implement WhatsApp Business API integration
- [ ] Set up WhatsApp templates for booking confirmations
- [ ] Create WhatsApp reminder notification system
- [ ] Implement booking modification and cancellation alerts via WhatsApp
- [ ] Build opt-in/opt-out functionality for WhatsApp communications
- [ ] Design fallback to email when WhatsApp delivery fails
- [ ] Create WhatsApp template approval workflow

### Advanced Admin Features
- [ ] Design system-wide analytics and reporting
- [ ] Create configuration settings interface

### Enhanced Platform Features
- [ ] Change the database structure of provider type to include an icon. Drive all provider type fields such as landing page search from database. Make it so that it displays the top provider types by availability. All provider types throughout app will be driven from database.
- [ ] Implement ability for a provider to configure their min availability slot and all availability slots must be multiples of this min availability slot. Enable the ability to manage multiple services in a single calendar.

## 🛠️ Technical Foundation & Operations

### Infrastructure & DevOps
- [ ] Set up project repository and CI/CD pipeline
- [ ] Configure database schema and migrations
- [ ] Implement role-based access control system
- [ ] Design and build reusable UI component library
- [ ] Create responsive layouts for mobile and desktop
- [ ] Set up logging, monitoring and error reporting
- [ ] Implement secure API architecture
- [ ] Design global state management solution

### Testing & Quality Assurance
- [ ] Write unit tests for critical components
- [ ] Implement integration tests for main workflows
- [ ] Create end-to-end tests for key user journeys
- [ ] Perform security testing and vulnerability assessment
- [ ] Conduct performance testing and optimization

### Deployment & Operations
- [ ] Configure staging environment
- [ ] Set up production environment
- [ ] Implement database backup strategy
- [ ] Create deployment automation
- [ ] Set up monitoring and alerts
- [ ] Implement SSL/TLS security

### Documentation & Support
- [ ] Create user documentation and help guides
- [ ] Write technical documentation for developers
- [ ] Build API documentation for integrations
- [ ] Create onboarding guides for different user types

## 🌟 Issues and Bugs Backlog

## 🧹 High Priority / Technical Debt
- [ ] Refactor data model relationships from 1-to-n to many-to-many where appropriate - Enable users to have multiple service provider roles and review other entity relationships for flexibility (Prisma schema, migrations, API endpoints)
- [ ] Change ServiceProvider to Provider throughout the codebase

## 📊 Medium Priority Issues
- [ ] Location creation doesn't save GP coordinates. Works on location update but not creation.
- [ ] Implement button loading spinner throughout app
- [ ] Admin organization doesn't display location well.
- [ ] Dashboard navigation when not ADMIN. Can't get a list of providers or see yourself in sidebar menu
- [ ] Personal Profile should reflect Role

