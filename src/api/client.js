/**
 * API Client for submitting verification requests
 */
export class APIClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  /**
   * Submit verification request to the backend
   * @param {Object} payload - Verification data
   * @returns {Promise<Object>} - API response
   */
  async submit(payload) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      return data;
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }
}
