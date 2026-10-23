const API_URL = "http://localhost:3000/api";

let csrfToken = null;
let csrfPromise = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfPromise) {
    csrfPromise = fetch(`${API_URL}/auth/csrf-token`, {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.csrfToken) {
          throw new Error(data.message || "Could not obtain CSRF token.");
        }

        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }

  return csrfPromise;
}

async function request(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const changesState = !["GET", "HEAD", "OPTIONS"].includes(method);

  async function sendRequest() {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (changesState) {
      headers["X-CSRF-Token"] = await getCsrfToken();
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      method,
      credentials: "include",
      headers,
    });
  }

  let response = await sendRequest();
  let data = await response.json();

  const csrfError =
    response.status === 403 &&
    changesState &&
    typeof data.message === "string" &&
    data.message.toLowerCase().includes("csrf");

  // A stale token can happen after the session changes.
  // Refresh it and retry once.
  if (csrfError) {
    csrfToken = null;
    await getCsrfToken();

    response = await sendRequest();
    data = await response.json();
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const api = {
  register: (formData) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
    }),

  login: async (formData) => {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    // Login may regenerate the server-side session.
    csrfToken = null;
    await getCsrfToken();

    return result;
  },

  me: () => request("/auth/me"),

  logout: async () => {
    const result = await request("/auth/logout", {
      method: "POST",
    });

    // Logout destroys the previous session.
    csrfToken = null;

    return result;
  },

  getUsers: () => request("/users"),

  updateUser: (id, formData) =>
    request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(formData),
    }),

  deleteUser: (id) =>
    request(`/users/${id}`, {
      method: "DELETE",
    }),
};
