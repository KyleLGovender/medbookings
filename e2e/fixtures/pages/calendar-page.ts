import { Page, expect } from '@playwright/test';

import { BasePage } from './base-page';

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isOnline?: boolean;
  location?: string;
  services?: string[];
}

export class CalendarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private selectors = {
    createAvailabilityButton:
      '[data-testid="create-availability"], button:has-text("Create"), .create-btn',
    dateInput: '[data-testid="date"], input[name="date"], input[type="date"]',
    startTimeInput:
      '[data-testid="start-time"], input[name="startTime"], input[type="time"]:first-of-type',
    endTimeInput:
      '[data-testid="end-time"], input[name="endTime"], input[type="time"]:last-of-type',
    locationSelect: '[data-testid="location"], select[name="location"], .location-select',
    onlineToggle: '[data-testid="online-toggle"], input[name="isOnline"], .online-checkbox',
    serviceCheckbox: (service: string) =>
      `[data-testid="service-${service}"], input[value="${service}"]`,
    saveButton: '[data-testid="save"], button:has-text("Save"), button[type="submit"]',
    cancelButton: '[data-testid="cancel"], button:has-text("Cancel"), .cancel-btn',
    successMessage: '[data-testid="success"], .success-message, .alert-success',
    errorMessage: '[data-testid="error"], .error-message, .alert-error',
    availabilityCard: '[data-testid="availability-card"], .availability-item',
    editButton: '[data-testid="edit"], button:has-text("Edit"), .edit-btn',
    deleteButton: '[data-testid="delete"], button:has-text("Delete"), .delete-btn',
    confirmDeleteButton: '[data-testid="confirm-delete"], button:has-text("Confirm")',
  };

  /**
   * Navigate to calendar page
   */
  async navigateToCalendar() {
    await this.goto('/calendar');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to availability creation page
   */
  async navigateToCreateAvailability() {
    await this.goto('/calendar/availability/create');
    await this.waitForPageLoad();
  }

  /**
   * Click create availability button
   */
  async clickCreateAvailability() {
    await this.waitForElement(this.selectors.createAvailabilityButton);
    await this.clickElement(this.selectors.createAvailabilityButton);
    await this.waitForPageLoad();
  }

  /**
   * Fill availability form
   */
  async fillAvailabilityForm(slot: AvailabilitySlot) {
    // Fill date
    await this.fillField(this.selectors.dateInput, slot.date);

    // Fill time slots
    await this.fillField(this.selectors.startTimeInput, slot.startTime);
    await this.fillField(this.selectors.endTimeInput, slot.endTime);

    // Set online/offline preference
    if (slot.isOnline !== undefined) {
      const onlineToggle = this.page.locator(this.selectors.onlineToggle);
      const isCurrentlyChecked = await onlineToggle.isChecked();

      if (slot.isOnline !== isCurrentlyChecked) {
        await onlineToggle.click();
      }
    }

    // Select location if provided and not online
    if (slot.location && !slot.isOnline) {
      await this.page.selectOption(this.selectors.locationSelect, slot.location);
    }

    // Select services if provided
    if (slot.services) {
      for (const service of slot.services) {
        const serviceCheckbox = this.page.locator(this.selectors.serviceCheckbox(service));
        if (await serviceCheckbox.isVisible()) {
          await serviceCheckbox.check();
        }
      }
    }
  }

  /**
   * Save availability slot
   */
  async saveAvailability() {
    await this.clickElement(this.selectors.saveButton);

    // Wait for either success or error message
    await Promise.race([
      this.waitForElement(this.selectors.successMessage),
      this.waitForElement(this.selectors.errorMessage),
    ]);
  }

  /**
   * Cancel availability creation/editing
   */
  async cancelAvailability() {
    await this.clickElement(this.selectors.cancelButton);
    await this.waitForPageLoad();
  }

  /**
   * Verify availability was created successfully
   */
  async verifyAvailabilityCreated() {
    await expect(this.page.locator(this.selectors.successMessage)).toBeVisible();
  }

  /**
   * Verify availability creation failed
   */
  async verifyAvailabilityError() {
    await expect(this.page.locator(this.selectors.errorMessage)).toBeVisible();
  }

  /**
   * Get all availability cards on the page
   */
  async getAvailabilityCards() {
    const cards = this.page.locator(this.selectors.availabilityCard);
    await cards
      .first()
      .waitFor({ state: 'visible', timeout: 5000 })
      .catch(() => {});

    const count = await cards.count();
    const availabilities = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const text = await card.textContent();
      availabilities.push({
        index: i,
        text: text?.trim() || '',
        element: card,
      });
    }

    return availabilities;
  }

  /**
   * Edit an availability slot
   */
  async editAvailability(index: number) {
    const cards = this.page.locator(this.selectors.availabilityCard);
    const editButton = cards.nth(index).locator(this.selectors.editButton);

    await editButton.waitFor({ state: 'visible' });
    await editButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Delete an availability slot
   */
  async deleteAvailability(index: number) {
    const cards = this.page.locator(this.selectors.availabilityCard);
    const deleteButton = cards.nth(index).locator(this.selectors.deleteButton);

    await deleteButton.waitFor({ state: 'visible' });
    await deleteButton.click();

    // Confirm deletion if confirmation dialog appears
    const confirmButton = this.page.locator(this.selectors.confirmDeleteButton);
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.waitForPageLoad();
  }

  /**
   * Create a complete availability slot
   */
  async createAvailabilitySlot(slot: AvailabilitySlot) {
    await this.navigateToCalendar();
    await this.clickCreateAvailability();
    await this.fillAvailabilityForm(slot);
    await this.saveAvailability();
    return this.verifyAvailabilityCreated();
  }

  /**
   * Verify availability appears in calendar
   */
  async verifyAvailabilityInCalendar(expectedText: string) {
    const availabilities = await this.getAvailabilityCards();
    const found = availabilities.some((av) => av.text.includes(expectedText));
    expect(found).toBeTruthy();
  }

  /**
   * Check if calendar page is accessible (user has provider permissions)
   */
  async verifyCalendarAccess() {
    await this.navigateToCalendar();

    // Should not redirect to login or show access denied
    await expect(this.page).not.toHaveURL(/\/login/);
    await expect(this.page.locator('text=Access denied')).not.toBeVisible();
  }
}
