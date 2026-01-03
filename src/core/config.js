/**
 * SDK Configuration handler
 */
export class Config {
  constructor() {
    this.defaults = {
      apiUrl: 'https://apisv2.windeal.co.ke/postdata',
      theme: 'light',
      language: 'en',
      debug: false,
      // Branding options
      organizationName: 'Identity Verification',
      logo: null, // URL to logo image
      primaryColor: '#00b8ff',
      secondaryColor: '#0d153b',
      accentColor: '#fa764a'
    };

    this.config = { ...this.defaults };
  }

  /**
   * Set configuration options
   * @param {Object} options - Configuration options
   */
  set(options) {
    this.config = {
      ...this.config,
      ...options
    };
  }

  /**
   * Get a configuration value
   * @param {string} key - Configuration key
   * @returns {*} - Configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Get all configuration
   * @returns {Object} - All configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Validate required configuration
   * @throws {Error} - If required config is missing
   */
  validate() {
    if (!this.config.workflowId) {
      throw new Error('workflowId is required');
    }

    if (!this.config.clientId) {
      throw new Error('clientId is required');
    }

    return true;
  }

  /**
   * Reset configuration to defaults
   */
  reset() {
    this.config = { ...this.defaults };
  }
}
