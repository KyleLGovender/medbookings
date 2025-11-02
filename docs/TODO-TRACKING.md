# TODO/FIXME Tracking

This document tracks all TODO and FIXME comments in the codebase, organized by priority and feature area.

**Last Updated**: 2025-11-02
**Total TODOs**: 19

---

## High Priority (Blocking Features)

### 1. Organization Logo Upload
**Status**: Not Implemented
**Impact**: High - User-facing feature
**Effort**: ~2 hours

**Files**:
- `src/features/organizations/components/profile/edit-organization-basic-info.tsx:155`
- `src/features/organizations/components/registration-form/organization-details-step.tsx:25`

**Implementation Notes**:
- Use Vercel Blob Storage (already configured)
- Follow pattern in `src/lib/storage/blob.ts`
- Add image validation (size, format)
- Update Prisma schema if needed

---

## Medium Priority (Nice to Have)

### 2. Calendar Import/Export
**Status**: Placeholder UI exists
**Impact**: Medium - Power user feature
**Effort**: ~4-6 hours

**Files**:
- `src/app/(dashboard)/calendar/availability/page.tsx:173` - Import functionality
- `src/app/(dashboard)/calendar/availability/page.tsx:184` - Export functionality

**Implementation Notes**:
- Support iCal format (.ics)
- Export: Generate .ics from availability data
- Import: Parse .ics and create availability records
- Consider Google Calendar sync integration

---

### 3. Organization Calendar View
**Status**: Provider view exists, organization view needed
**Impact**: Medium - Multi-provider organizations
**Effort**: ~3-4 hours

**Files**:
- `src/app/(dashboard)/organizations/[id]/manage-calendar/page.tsx:197`

**Implementation Notes**:
- Show combined calendar for all organization providers
- Filter by provider
- Color-code by provider
- Reuse existing calendar components

---

### 4. Error Monitoring Integration
**Status**: Code comments in place
**Impact**: Medium - Production observability
**Effort**: ~1-2 hours

**Files**:
- `src/app/(general)/(auth)/error/page.tsx:73`

**Implementation Notes**:
- Integrate Sentry (already in package.json: `@sentry/nextjs`)
- Configure DSN in environment variables
- Test error boundary reporting
- See: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

## Low Priority (Future Enhancements)

### 5. Email Notifications (13 TODOs)
**Status**: SendGrid configured, templates needed
**Impact**: Low - System works without emails (for now)
**Effort**: ~6-8 hours total

**Communication Platform**:
- SendGrid API configured (`SENDGRID_API_KEY`)
- From address: `SENDGRID_FROM_EMAIL`
- Email utility: `src/lib/communications/email.ts` (needs implementation)

**TODOs by Feature**:

#### Organizations (7 emails)
1. **Registration Notification** (`organizations/lib/actions.ts:35`)
   - Trigger: New organization registered
   - Recipients: ADMIN_NOTIFICATION_EMAIL
   - Template: org-registration-admin.html

2. **Invitation Email** (`organizations/lib/actions.ts:105`)
   - Trigger: User invited to organization
   - Recipients: Invitee email
   - Template: org-invitation.html

3. **Welcome Email** (`organizations/lib/actions.ts:145`)
   - Trigger: Invitation accepted
   - Recipients: New member
   - Template: org-welcome-member.html

4. **Rejection Notification** (`organizations/lib/actions.ts:181`)
   - Trigger: Invitation rejected
   - Recipients: Inviter
   - Template: org-invitation-rejected.html

5. **Role Change Notification** (`organizations/lib/actions.ts:228`)
   - Trigger: Member role updated
   - Recipients: Member
   - Template: org-role-changed.html

6. **Removal Notification** (`organizations/lib/actions.ts:269`)
   - Trigger: Member removed
   - Recipients: Removed member
   - Template: org-member-removed.html

7. **Invitation Cancellation** (`organizations/lib/actions.ts:310`)
   - Trigger: Invitation cancelled
   - Recipients: Invitee
   - Template: org-invitation-cancelled.html

8. **tRPC Invitation** (`server/api/routers/organizations.ts:782`)
   - Duplicate of #2 above (consolidate)

#### Profile (2 emails)
9. **Profile Update Notification** (`profile/lib/actions.ts:50`)
   - Trigger: User updates profile
   - Recipients: User (confirmation)
   - Template: profile-updated.html

10. **Account Deletion Notification** (`profile/lib/actions.ts:99`)
    - Trigger: User deletes account
    - Recipients: User (farewell email)
    - Template: account-deleted.html

#### Billing (3 emails)
11. **Subscription Creation** (`billing/lib/actions.ts:58`)
    - Trigger: New subscription started
    - Recipients: Subscriber
    - Template: subscription-created.html

12. **Subscription Update** (`billing/lib/actions.ts:160`)
    - Trigger: Subscription plan changed
    - Recipients: Subscriber
    - Template: subscription-updated.html

13. **Subscription Cancellation** (`billing/lib/actions.ts:212`)
    - Trigger: Subscription cancelled
    - Recipients: Subscriber
    - Template: subscription-cancelled.html

**Implementation Strategy**:
1. Create SendGrid templates (use their visual editor)
2. Create helper function: `sendTransactionalEmail(template, data, recipient)`
3. Replace TODO comments with actual email calls
4. Add email queue for reliability (optional: use Vercel Serverless Functions + Redis)

**Priority Order**:
1. Organization invitation (most critical)
2. Organization registration notification
3. Subscription notifications
4. Profile notifications
5. Role/membership changes

---

## Implementation Guidelines

### Before Implementing a TODO:

1. **Check Dependencies**:
   - Is the feature blocked by other work?
   - Are required services configured? (Blob Storage, SendGrid, etc.)

2. **Review Related Code**:
   - Find similar implementations in the codebase
   - Follow existing patterns (see DEVELOPER-PRINCIPLES.md)

3. **Update This Document**:
   - Mark TODO as "In Progress"
   - Add implementation notes
   - Update "Last Updated" date

4. **After Implementation**:
   - Remove TODO comment from code
   - Mark as ✅ Complete in this document
   - Add entry to git commit message

---

## Completed TODOs

None yet. This tracking document was created on 2025-11-02.

---

## Notes

- **Email Templates**: Use SendGrid's dynamic templates for maintainability
- **Testing**: Test emails in staging environment first
- **Rate Limiting**: SendGrid free tier: 100 emails/day (upgrade as needed)
- **Compliance**: Ensure all emails comply with CAN-SPAM Act (unsubscribe link)
- **POPIA**: Email notifications must respect South African data protection law

---

## Related Documentation

- `/docs/compliance/LOGGING.md` - PHI sanitization in logs
- `/docs/guides/DEVELOPER-PRINCIPLES.md` - Code patterns and practices
- `/docs/deployment/VERCEL-DEPLOYMENT.md` - Environment variable setup
- SendGrid Integration: https://sendgrid.com/docs/for-developers/

---

**Maintenance**: Review this document monthly. Archive completed items after 3 months.
