const BASE = "";

async function json(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (password) =>
    json("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) }),

  getPhotos: () => json("/api/photos"),
  uploadPhotos: async (files, albumId) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("albumId", albumId);
    const res = await fetch(`${BASE}/api/photos`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },
  deletePhoto: (id) => json(`/api/photos/${id}`, { method: "DELETE" }),

  getAlbums: () => json("/api/albums"),
  createAlbum: (name) =>
    json("/api/albums", { method: "POST", body: JSON.stringify({ name }) }),

  getRequests: () => json("/api/requests"),
  createRequest: (data) =>
    json("/api/requests", { method: "POST", body: JSON.stringify(data) }),
  approveRequest: (id) => json(`/api/requests/${id}/approve`, { method: "PATCH" }),
  rejectRequest: (id) => json(`/api/requests/${id}/reject`, { method: "PATCH" }),

  getMessages: () => json("/api/messages"),
};
