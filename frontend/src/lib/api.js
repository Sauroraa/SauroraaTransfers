const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/api";

export function uploadTransfer(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/transfers`);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText).message || "Upload impossible."));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur reseau."));
    xhr.send(formData);
  });
}

export async function fetchTransfer(token) {
  const response = await fetch(`${API_BASE}/transfers/${token}`);
  if (!response.ok) {
    throw new Error("Transfert introuvable.");
  }
  return response.json();
}

export async function verifyTransfer(token, password) {
  const response = await fetch(`${API_BASE}/transfers/${token}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Verification impossible.");
  }
  return response.json();
}

export function downloadUrl(token, fileId, password) {
  const url = new URL(`${API_BASE}/download/${token}/${fileId}`);
  if (password) {
    url.searchParams.set("password", password);
  }
  return url.toString();
}

