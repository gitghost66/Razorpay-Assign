/**
 * api.js
 * Centralised HTTP client.
 * Wraps fetch() with:
 *   - Base URL prepending
 *   - credentials: 'include' (sends session cookie)
 *   - JSON request/response serialisation
 *   - Normalised error objects
 */

const API = (() => {
  /**
   * Core request helper.
   * @param {string} path    - Endpoint path, e.g. '/rest/onboardings/login'
   * @param {object} options - fetch options (method, body, etc.)
   * @returns {Promise<object>} Parsed JSON response body
   */
  async function request(path, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${path}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      credentials: 'include', // send session cookie on every request
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    // Serialise body if it's a plain object
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkErr) {
      // Network-level failure (server offline, CORS, etc.)
      throw {
        status : 0,
        message: 'Cannot reach the server. Check your connection.',
      };
    }

    let data;
    try {
      data = await response.json();
    } catch {
      data = { status: 'error', message: `HTTP ${response.status}` };
    }

    if (!response.ok) {
      throw {
        status : response.status,
        message: data.message || `Request failed (${response.status})`,
      };
    }

    return data;
  }

  /* ── Convenience methods ───────────────────────────────── */

  function get(path) {
    return request(path, { method: 'GET' });
  }

  function post(path, body) {
    return request(path, { method: 'POST', body });
  }

  function patch(path, body) {
    return request(path, { method: 'PATCH', body });
  }

  function del(path, body) {
    return request(path, { method: 'DELETE', body });
  }

  return { get, post, patch, del, request };
})();
