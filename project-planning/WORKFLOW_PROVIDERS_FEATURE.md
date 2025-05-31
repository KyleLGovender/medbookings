# Workflow: Implementing the Providers Feature

This document tracks the progress of implementing the 'providers' feature.

## Phase 1: Discovery & Planning

- [x] **1. Define Core Objectives & Scope**
  - **Target Users & Core Functionality:**
    - **Service Providers:**
      - Register on the platform, submitting all necessary regulatory documents and information (requirements will be dynamic based on provider type, e.g., HPCSA number, certificates, medical insurance details, degrees).
      - View the status of their registration (e.g., Pending Approval, Approved, Rejected, Needs Amendment).
      - Receive and view feedback on their registration submission if it's rejected or requires amendments.
      - Amend and resubmit their registration details and documents.
      - Once approved, edit their own profile information (e.g., display name, contact details, professional bio, profile photo).
    - **ADMIN / SUPER_ADMIN Users:**
      - Review incoming provider registration submissions, including all submitted documents and information.
      - Approve provider registrations, changing their status to 'Active'.
      - Reject provider registrations, providing clear reasons/feedback to the provider.
      - Suspend active provider accounts if necessary.
      - View a dashboard or statistics regarding provider statuses (e.g., number of active providers, pending approvals, suspended accounts).
    - **Organization Managers:**
      - Search for registered and approved providers on the platform.
      - Send connection requests to providers, inviting them to affiliate with their organization (this connection will later enable availability configuration for that organization).
  - **Essential Must-Haves for V1 (Summary):**
    - A comprehensive registration workflow for service providers, including dynamic submission of regulatory requirements.
    - The ability for service providers to manage and edit their own profiles after approval.
    - A robust review and approval/rejection/suspension workflow for ADMIN/SUPER_ADMIN users.
    - Functionality for Organization Managers to search for and initiate connections with providers.
  - **Explicitly Out of Scope for V1:**
    - Configuration of provider availability schedules.
    - Client booking of appointments with providers.
    - Any direct billing or payment processing features related to provider services (unless basic fee information is part of their profile).
- [ ] **2. Data Model Deep Dive**
  - Review `ServiceProvider` and related models in `prisma/schema.prisma`.
  - Identify any necessary schema adjustments.
- [ ] **3. API Endpoint Design**
  - Define RESTful API endpoints (e.g., create, list, get by ID, update, delete).
  - Outline request/response structures.
- [ ] **4. High-Level UI/UX Flow**
  - Describe key user interfaces and interactions (e.g., list page, detail page, forms).
- [ ] **5. Identify Key Dependencies**
  - List interactions with other features (auth, users, services, organizations, etc.).

## Phase 2: Iterative Implementation

(Sub-steps for Types, Lib, API, Components, Hooks, Pages, Testing will be detailed as we progress)

- [ ] **1. Setup Feature Skeleton** (`src/features/providers/`)
- [ ] **2. Types and Validation Schemas** (`src/features/providers/types/`)
- [ ] **3. Core Logic & Database Interaction** (`src/features/providers/lib/`)
- [ ] **4. API Route Handlers** (`src/features/providers/api/` & `src/app/api/providers/`)
- [ ] **5. UI Components** (`src/features/providers/components/`)
- [ ] **6. Custom Hooks** (`src/features/providers/hooks/`)
- [ ] **7. Page Integration** (`src/app/(dashboard)/providers/`)
- [ ] **8. Testing** (Unit, Component, Integration as agreed)

## Phase 3: Review, Refinement & Polish

- [ ] **1. End-to-End Testing**
- [ ] **2. Code Review**
- [ ] **3. Final Adjustments & Documentation Updates**
