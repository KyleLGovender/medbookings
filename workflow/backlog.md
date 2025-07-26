# MedBookings MVP Project Plan

----------------------------------------------------------------------------------------

## 🚀 Current Sprint (In Progress)
- [ ] Implement testing throughout the application. https://github.com/microsoft/playwright-mcp 
- [ ] Implement user roles system (guest, user, provider, organization manager, admin)
- [ ] **Technical Debt**: Critical cleanup of availability-creation-form.tsx as reference pattern - `src/features/calendar/availability/components/availability-creation-form.tsx:1`
  - **Issue**: The availability-creation-form.tsx component needs comprehensive cleanup to serve as a clean reference pattern before it can be used as a template for standardizing the edit form. Current issues include: potential legacy code, inconsistent patterns, TODO comments (line 237), unused variables, complex state management that may not follow CLAUDE.md patterns, and general code quality issues that make it difficult to maintain and use as a reliable reference.
  - **Impact**: Without a clean reference pattern, attempts to standardize the edit form will propagate existing technical debt and inconsistencies. This prevents the availability forms from serving as reliable patterns for other calendar implementations and makes future development more error-prone.
  - **Implementation**:
    1. **Critical Code Review**: Thoroughly review entire component for unnecessary code, legacy patterns, and development artifacts
    2. **Remove Dead Code**: Remove unused variables, commented code, and any development debugging artifacts
    3. **Resolve TODOs**: Address the TODO comment at line 237 for organization provider selection - either implement properly or remove
    4. **State Management Cleanup**: Simplify and standardize state management patterns following CLAUDE.md guidelines
    5. **Type Safety**: Ensure all types are properly defined, remove any 'any' types (line 99, 486, 487)
    6. **Component Structure**: Ensure component follows consistent patterns for form handling, validation, and error management
    7. **Code Organization**: Group related logic together, extract reusable functions if needed
    8. **Error Handling**: Standardize error handling patterns and loading states
    9. **Performance**: Review for unnecessary re-renders and optimize form watchers
    10. **Documentation**: Add JSDoc comments for complex logic and ensure code is self-documenting
    11. **CLAUDE.md Compliance**: Ensure all patterns follow the standards specified in CLAUDE.md
    12. **Testing Readiness**: Structure code to be easily testable and maintainable
  - **Testing**:
    - All existing functionality works exactly as before
    - No console errors or warnings
    - TypeScript compilation without warnings
    - Form validation works correctly
    - All form fields and interactions function properly
    - Custom recurrence modal works correctly
    - Service selection works as expected
    - Location selection functions properly
    - Profile selection works for both provider and organization modes
  - **Estimated Time**: 4-5 hours
- [ ] **Technical Debt**: Standardize availability-edit-form.tsx to match cleaned creation form pattern - `src/features/calendar/availability/components/availability-edit-form.tsx:1`
  - **Issue**: The availability-edit-form.tsx component doesn't follow the same comprehensive pattern as the availability-creation-form.tsx. It's missing key sections like profile selection, recurrence settings, location management, and doesn't have the same level of form organization and structure. This inconsistency makes the codebase harder to maintain and creates confusion for developers working with both forms.
  - **Impact**: Inconsistent form patterns across the availability system create maintenance burden, confuse developers, and make it difficult to ensure feature parity between creation and editing workflows. Users may expect similar functionality in both forms but find missing features in the edit form.
  - **Implementation**:
    1. **PREREQUISITE**: Complete cleanup of availability-creation-form.tsx first to ensure clean reference pattern
    2. **Pattern Analysis**: Study the cleaned creation form structure and identify all sections and patterns
    3. **Add Missing Sections**: 
       - Profile selection section (creator type, provider selection) - adapted for edit mode
       - Recurrence settings section with custom recurrence modal support
       - Location section with online/physical location management
       - Proper form organization with consistent separators and headings
    4. **Adapt for Edit Mode**: Modify sections appropriately for editing:
       - Profile selection may be read-only or limited based on permissions
       - Recurrence editing needs series update options (single/series/future)
       - Location changes may be restricted if bookings exist
       - Time changes restricted when bookings exist (already implemented)
    5. **State Management**: Align state management patterns with creation form
    6. **Form Structure**: Use same form organization, validation, and error handling patterns
    7. **UI Components**: Use consistent UI components, icons, and styling patterns
    8. **Form Validation**: Ensure validation rules are consistent between forms
    9. **Error Handling**: Standardize error handling and loading states
    10. **Accessibility**: Ensure accessibility patterns match creation form
    11. **Testing Integration**: Ensure both forms can be tested using similar patterns
  - **Testing**:
    - All existing edit functionality continues to work
    - New sections (profile, recurrence, location) display correctly
    - Form validation works consistently with creation form
    - Booking restrictions still apply appropriately
    - Series editing options work correctly for recurring availabilities
    - Location changes respect booking constraints
    - Form submission and error handling work correctly
    - Accessibility features work properly
    - Both forms have consistent user experience
  - **Estimated Time**: 6-8 hours

----------------------------------------------------------------------------------------

## 📋 Ready for Development (Prioritized)


----------------------------------------------------------------------------------------

## 📝 Quick Capture (New Issues)
- [ ] Populate provider and organization and user email addresses with the associated Google email. Not possible to edit.
- [ ] Remove Calendar from Menu based on user logged in
- [ ] Protect Calendar routes based on authentication
- [ ] Review centralized calendar views
- [ ] Location creation doesn't save GP coordinates. Works on location update but not creation.
- [ ] Implement button loading spinner throughout app
- [ ] Admin organization doesn't display location well.
- [ ] Dashboard navigation when not ADMIN. Can't get a list of providers or see yourself in sidebar menu
- [ ] Personal Profile should reflect Role
- [ ] Does Hybrid Billing actually exist?
- [ ] Provider onboarding default prices... need to make sure the input fields make sense.  Price seems to only accept 5.

----------------------------------------------------------------------------------------

## ✅ Recently Completed
- [x] Context 7 documentation
- [x] Firecrawl
- [x] Claude Code Plan Upgrade

----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------

## 🌟 Issues and Bugs Backlog

----------------------------------------------------------------------------------------

## 🔥 High Priority Issues & Tasks

----------------------------------------------------------------------------------------

## 📊 Medium Priority Issues & Tasks


  
----------------------------------------------------------------------------------------


## 🧹 Low Priority Issues & Tasks


----------------------------------------------------------------------------------------

## 📊 Project Health
- **Total Active Issues**: 10
- **High Priority**: 1
- **Medium Priority**: 6
- **Low Priority**: 1
- **Current Sprint**: 1
- **Ready for Dev**: 0
- **Recently Completed**: 14
- **Last Updated**: 2025-01-21

----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------

# 📋 MVP Roadmap

----------------------------------------------------------------------------------------

## 🎯 MVP Phase 1: Core Platform (Must-Have for Launch)

### Foundation (Get System Working)
- [x] Fix all build errors and get system building cleanly
- [x] Remove/clean up non-MVP code to focus on core functionality
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

----------------------------------------------------------------------------------------

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

----------------------------------------------------------------------------------------

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

----------------------------------------------------------------------------------------

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

----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------



