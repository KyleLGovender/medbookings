import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export class BookingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Selectors
  private selectors = {
    locationInput: '[data-testid="location-input"], input[name="location"], input[placeholder*="location" i]',
    serviceInput: '[data-testid="service-input"], input[name="service"], input[placeholder*="service" i]',
    searchButton: '[data-testid="search-button"], button[type="submit"], button:has-text("Search")',
    providerCard: (name: string) => `[data-testid="provider-${name}"], .provider-card:has-text("${name}")`,
    dateSlot: (date: string) => `[data-testid="date-${date}"], .date-slot[data-date="${date}"]`,
    timeSlot: (time: string) => `[data-testid="time-${time}"], .time-slot[data-time="${time}"]`,
    guestNameInput: '[data-testid="guest-name"], input[name="guestName"], input[name="clientName"]',
    guestEmailInput: '[data-testid="guest-email"], input[name="guestEmail"], input[name="clientEmail"]',
    guestPhoneInput: '[data-testid="guest-phone"], input[name="guestPhone"], input[name="clientPhone"]',
    notesInput: '[data-testid="notes"], textarea[name="notes"]',
    confirmButton: '[data-testid="confirm-booking"], button:has-text("Confirm"), button:has-text("Book")',
    successMessage: '[data-testid="booking-success"], .success-message, .booking-confirmation',
    errorMessage: '[data-testid="booking-error"], .error-message',
  };

  /**
   * Navigate to provider search page
   */
  async navigateToProviderSearch() {
    await this.goto('/providers');
    await this.waitForPageLoad();
  }

  /**
   * Search for providers by location and service
   */
  async searchProviders(location: string, service?: string) {
    // Fill location
    await this.fillField(this.selectors.locationInput, location);

    // Fill service if provided
    if (service) {
      await this.fillField(this.selectors.serviceInput, service);
    }

    // Click search
    await this.clickElement(this.selectors.searchButton);
    await this.waitForPageLoad();
  }

  /**
   * Select a provider from search results
   */
  async selectProvider(providerName: string) {
    const providerSelector = this.selectors.providerCard(providerName);
    await this.waitForElement(providerSelector);
    await this.clickElement(providerSelector);
    await this.waitForPageLoad();
  }

  /**
   * Select date and time slot
   */
  async selectTimeSlot(date: string, time: string) {
    // Select date
    const dateSelector = this.selectors.dateSlot(date);
    await this.waitForElement(dateSelector);
    await this.clickElement(dateSelector);

    // Select time
    const timeSelector = this.selectors.timeSlot(time);
    await this.waitForElement(timeSelector);
    await this.clickElement(timeSelector);
  }

  /**
   * Fill booking form with guest information
   */
  async fillBookingForm(guestInfo: GuestInfo) {
    await this.fillField(this.selectors.guestNameInput, guestInfo.name);
    await this.fillField(this.selectors.guestEmailInput, guestInfo.email);
    await this.fillField(this.selectors.guestPhoneInput, guestInfo.phone);

    if (guestInfo.notes) {
      await this.fillField(this.selectors.notesInput, guestInfo.notes);
    }
  }

  /**
   * Confirm the booking
   */
  async confirmBooking() {
    await this.clickElement(this.selectors.confirmButton);

    // Wait for either success or error message
    await Promise.race([
      this.waitForElement(this.selectors.successMessage),
      this.waitForElement(this.selectors.errorMessage),
    ]);
  }

  /**
   * Verify booking was successful
   */
  async verifyBookingSuccess() {
    await expect(this.page.locator(this.selectors.successMessage)).toBeVisible();
  }

  /**
   * Verify booking failed with error
   */
  async verifyBookingError() {
    await expect(this.page.locator(this.selectors.errorMessage)).toBeVisible();
  }

  /**
   * Get booking confirmation details
   */
  async getBookingConfirmation() {
    const confirmationElement = this.page.locator(this.selectors.successMessage);
    await confirmationElement.waitFor({ state: 'visible' });

    return {
      isVisible: await confirmationElement.isVisible(),
      text: await confirmationElement.textContent(),
    };
  }

  /**
   * Complete full booking flow
   */
  async completeBookingFlow(
    location: string,
    providerName: string,
    date: string,
    time: string,
    guestInfo: GuestInfo
  ) {
    await this.navigateToProviderSearch();
    await this.searchProviders(location);
    await this.selectProvider(providerName);
    await this.selectTimeSlot(date, time);
    await this.fillBookingForm(guestInfo);
    await this.confirmBooking();
    return this.getBookingConfirmation();
  }
}