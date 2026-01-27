/**
 * Sign-in Page Object Model
 * Handles authentication flows
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../base.page';

export class SignInPage extends BasePage {
  readonly emailInput: Locator;
  readonly otpInput: Locator;
  readonly submitButton: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.otpInput = page.locator('input[name="code"], input[placeholder*="code"], input[placeholder*="OTP"]').first();
    this.submitButton = page.locator('button[type="submit"]').first();
    this.continueButton = page.getByRole('button', { name: /continue/i }).first();
  }

  /**
   * Navigate to sign-in page
   */
  async goto(): Promise<void> {
    await super.goto('/sign-in');
  }

  /**
   * Enter email address
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Enter OTP code
   */
  async enterOTP(code: string): Promise<void> {
    await this.otpInput.fill(code);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click continue button (after email entry)
   */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Wait for redirect after successful sign-in
   */
  async waitForRedirect(expectedPath?: string, timeout = 10000): Promise<void> {
    if (expectedPath) {
      await this.page.waitForURL(expectedPath, { timeout });
    } else {
      // Wait for any redirect away from sign-in
      await this.page.waitForURL(/^(?!.*\/sign-in).*$/, { timeout });
    }
  }

  /**
   * Complete full sign-in flow with email and OTP
   */
  async signIn(email: string, otp: string, expectedPath?: string): Promise<void> {
    await this.enterEmail(email);
    await this.continue();
    await this.page.waitForTimeout(1000); // Wait for OTP input to appear
    await this.enterOTP(otp);
    await this.submit();
    await this.waitForRedirect(expectedPath);
  }

  /**
   * Check if email input is visible
   */
  async isEmailInputVisible(): Promise<boolean> {
    return this.emailInput.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if OTP input is visible
   */
  async isOTPInputVisible(): Promise<boolean> {
    return this.otpInput.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Get validation error message
   */
  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[role="alert"], .text-destructive, .text-red-500').first();
    return (await errorElement.textContent()) || '';
  }

  /**
   * Expect sign-in error
   */
  async expectError(message?: string | RegExp): Promise<void> {
    const errorElement = this.page.locator('[role="alert"], .text-destructive').first();
    await expect(errorElement).toBeVisible();
    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }
}
