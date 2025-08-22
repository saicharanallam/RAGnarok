// API configuration for RAGnarok frontend
class ApiConfig {
  constructor() {
    // Get the API base URL from environment variable or use default
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
    
    // Ensure the base URL doesn't end with a slash
    this.baseURL = this.baseURL.replace(/\/$/, '');
  }

  // Get the full URL for an API endpoint
  getUrl(endpoint) {
    // Remove leading slash from endpoint if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseURL}/${cleanEndpoint}`;
  }

  // Create fetch options with default headers
  getFetchOptions(options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    return defaultOptions;
  }

  // Wrapper for fetch with automatic URL resolution and better error handling
  async fetch(endpoint, options = {}) {
    const url = this.getUrl(endpoint);
    const fetchOptions = this.getFetchOptions(options);
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`API ${fetchOptions.method || 'GET'} ${url} -> ${response.status}`);
      }
      
      return response;
    } catch (error) {
      // Enhanced error logging
      console.error(`API request failed for ${url}:`, {
        error: error.message,
        method: fetchOptions.method || 'GET',
        baseURL: this.baseURL,
        endpoint
      });
      
      // Throw a more descriptive error
      const enhancedError = new Error(`Failed to connect to backend API at ${this.baseURL}. Please ensure the backend services are running.`);
      enhancedError.originalError = error;
      enhancedError.url = url;
      throw enhancedError;
    }
  }

  // Helper methods for common HTTP methods
  async get(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data, options = {}) {
    return this.fetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint, options = {}) {
    return this.fetch(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file method (for multipart/form-data)
  async uploadFile(endpoint, formData, options = {}) {
    const url = this.getUrl(endpoint);
    const uploadOptions = {
      method: 'POST',
      body: formData,
      ...options
    };

    // Don't set Content-Type header for FormData - browser will set it with boundary
    if (uploadOptions.headers) {
      delete uploadOptions.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, uploadOptions);
      return response;
    } catch (error) {
      console.error(`File upload failed for ${url}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiConfig = new ApiConfig();
export default apiConfig;
