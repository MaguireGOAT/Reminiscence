const GITHUB_API = "https://api.github.com";

export function getRepoInfo() {
  // These are set by the admin in the UI and stored in localStorage
  const owner = localStorage.getItem("gh_owner") || "";
  const repo = localStorage.getItem("gh_repo") || "";
  const branch = localStorage.getItem("gh_branch") || "main";
  return { owner, repo, branch };
}

export function setRepoInfo(owner, repo, branch = "main") {
  localStorage.setItem("gh_owner", owner);
  localStorage.setItem("gh_repo", repo);
  localStorage.setItem("gh_branch", branch);
}

export function getToken() {
  return localStorage.getItem("gh_token") || "";
}

export function setToken(token) {
  localStorage.setItem("gh_token", token);
}

export function clearAuth() {
  localStorage.removeItem("gh_token");
  localStorage.removeItem("gh_owner");
  localStorage.removeItem("gh_repo");
  localStorage.removeItem("gh_branch");
}

export function isAuthenticated() {
  const { owner, repo } = getRepoInfo();
  return !!getToken() && !!owner && !!repo;
}

async function ghFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No GitHub token configured");
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }
  return response.json();
}

async function getFileSha(path) {
  const { owner, repo, branch } = getRepoInfo();
  try {
    const data = await ghFetch(
      `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );
    return data.sha;
  } catch {
    return null;
  }
}

export async function commitFile(path, content, message) {
  const { owner, repo, branch } = getRepoInfo();
  const sha = await getFileSha(path);
  const body = {
    message,
    content: typeof content === "string"
      ? btoa(unescape(encodeURIComponent(content)))
      : content,
    branch
  };
  if (sha) body.sha = sha;
  return ghFetch(`/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function commitBinary(path, file, message) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  return commitFile(path, base64, message);
}

export async function readFile(path) {
  const { owner, repo, branch } = getRepoInfo();
  const data = await ghFetch(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  );
  const decoded = atob(data.content);
  return decoded;
}

export async function readJson(path) {
  const text = await readFile(path);
  return JSON.parse(text);
}

export async function fetchOEmbed(url) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Failed to fetch oEmbed");
  return response.json();
}
