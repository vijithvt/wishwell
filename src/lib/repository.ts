import type { Repository } from "./types";
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: "Request failed" }));
    throw new Error(e.error || "Request failed");
  }
  return r.status === 204 ? (undefined as T) : r.json();
}
export const sqliteRepository: Repository = {
  students: () => request("students"),
  saveStudent: (s) => request(`students/${s.id}`, "PUT", s),
  deleteStudent: (id) => request(`students/${id}`, "DELETE"),
  brand: () => request("brand"),
  saveBrand: (b) => request("brand", "PUT", b),
  posters: () => request("posters"),
  savePoster: (p) => request(`posters/${p.id}`, "PUT", p),
  deletePoster: (id) => request(`posters/${id}`, "DELETE"),
};
