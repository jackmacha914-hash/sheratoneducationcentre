// apiFetch.js

// Ensure API base is always defined
window.API_CONFIG = {
  API_BASE_URL: "https://sheratoneducationcentre.onrender.com/api"
};

// Core apiFetch wrapper
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.API_BASE_URL}${endpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.body && !(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config = { ...options, headers, credentials: 'include', mode: 'cors' };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.clear();
    window.location.href = '/login.html';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${await response.text()}`);
  }

  return response.status === 204 ? null : await response.json();
}

window.apiFetch = apiFetch;

// 🟢 Intercept *all* fetch calls (hardcoded included)
if (!window._fetchOverridden) {
  const originalFetch = window.fetch;

  window.fetch = function(input, options = {}) {
    if (typeof input === "string") {
      // Replace old domain with new one
      if (input.startsWith("https://school-management-system-av07.onrender.com")) {
        console.warn("⚠️ Rewriting old API URL →", input);
        input = input.replace(
          "https://school-management-system-av07.onrender.com",
          API_CONFIG.API_BASE_URL
        );
      }
      // If it's a relative path, prepend base
      else if (!input.startsWith("http")) {
        input = `${API_CONFIG.API_BASE_URL}${input}`;
      }
    }
    return originalFetch(input, options);
  };

  window._fetchOverridden = true;
}
