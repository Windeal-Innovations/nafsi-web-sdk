import { Config } from './config.js';
import { Modal } from '../ui/modal.js';
import logger from '../utils/logger.js';

/**
 * Nafsi Web SDK
 * Main entry point for the identity verification SDK
 */
class NafsiSDK {
  constructor() {
    this.config = new Config();
    this.modal = null;
    this.initialized = false;
    this.version = '1.0.0';

    logger.log('Nafsi SDK loaded, version:', this.version);
  }

  /**
   * Initialize the SDK
   * @param {Object} options - Configuration options
   * @param {string} options.workflowId - Workflow ID (required)
   * @param {string} options.clientId - Client ID (required)
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onFailure - Failure callback
   * @param {string} options.apiUrl - API endpoint URL (optional)
   * @param {string} options.theme - UI theme (optional)
   * @param {string} options.language - Language (optional)
   * @param {boolean} options.debug - Enable debug logging (optional)
   * @param {string} options.organizationName - Organization name for branding (optional)
   * @param {string} options.logo - Logo URL for branding (optional)
   * @param {string} options.primaryColor - Primary brand color (optional)
   * @param {string} options.secondaryColor - Secondary brand color (optional)
   * @param {string} options.accentColor - Accent brand color (optional)
   */
  init(options) {
    try {
      // Validate required options
      if (!options) {
        throw new Error('Options object is required');
      }

      if (!options.workflowId) {
        throw new Error('workflowId is required');
      }

      if (!options.clientId) {
        throw new Error('clientId is required');
      }

      // Set configuration
      this.config.set({
        workflowId: options.workflowId,
        clientId: options.clientId,
        onSuccess: options.onSuccess || (() => {}),
        onFailure: options.onFailure || (() => {}),
        apiUrl: options.apiUrl || this.config.get('apiUrl'),
        theme: options.theme || this.config.get('theme'),
        language: options.language || this.config.get('language'),
        debug: options.debug || false,
        // Branding options
        organizationName: options.organizationName || this.config.get('organizationName'),
        logo: options.logo || this.config.get('logo'),
        primaryColor: options.primaryColor || this.config.get('primaryColor'),
        secondaryColor: options.secondaryColor || this.config.get('secondaryColor'),
        accentColor: options.accentColor || this.config.get('accentColor')
      });

      this.initialized = true;

      logger.log('SDK initialized with config:', {
        workflowId: options.workflowId,
        clientId: options.clientId,
        apiUrl: this.config.get('apiUrl'),
        theme: this.config.get('theme'),
        language: this.config.get('language')
      });

      // Auto-start verification flow
      this.start();
    } catch (error) {
      logger.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Start the verification flow
   */
  start() {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call Nafsi.init() first.');
    }

    try {
      // Create and show modal
      this.modal = new Modal(this.config.getAll());
      this.modal.show();

      logger.log('Verification flow started');
    } catch (error) {
      logger.error('Error starting verification:', error);
      throw error;
    }
  }

  /**
   * Close/cancel the verification flow
   */
  close() {
    if (this.modal) {
      this.modal.hide();
      this.modal = null;
      logger.log('Verification flow closed');
    }
  }

  /**
   * Get SDK version
   * @returns {string} SDK version
   */
  getVersion() {
    return this.version;
  }

  /**
   * Check if SDK is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }
}

// Create global instance
const Nafsi = new NafsiSDK();

// Export for webpack
export default Nafsi;

// Also attach to window for direct script tag usage
if (typeof window !== 'undefined') {
  window.Nafsi = Nafsi;
}
