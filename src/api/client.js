/**
 * API Client for submitting verification requests
 */
export class APIClient {
  constructor(apiUrl, accessToken = null) {
    this.apiUrl = apiUrl;
    this.accessToken = accessToken;
  }

  /**
   * Submit verification request to the backend
   * @param {Object} payload - Verification data
   * @returns {Promise<Object>} - API response
   */
  async submit(payload) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if accessToken is provided
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: headers,
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
