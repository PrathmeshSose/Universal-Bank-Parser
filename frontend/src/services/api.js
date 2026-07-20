const BASE_URL = "http://localhost:5000/api";

export const uploadPDF = async (file, bankName, password = "") => {
  const formData = new FormData();

  // Must match upload.single("document") in the backend
  formData.append("document", file);
  formData.append("bankName", bankName);
  
  if (password) {
    formData.append("password", password);
  }

  const response = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data.data;
};

export const exportToCSV = async (transactions) => {
  const response = await fetch(`${BASE_URL}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // The backend expects `{ verifiedData: [...] }`
    body: JSON.stringify({ verifiedData: transactions }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Export failed");
  }

  // The backend returns a raw CSV string (text/csv)
  const csvText = await response.text();
  
  // Create a Blob from the CSV text and trigger a download in the browser
  const blob = new Blob([csvText], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'verified_bank_statement.csv';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  return true;
};

export const fetchBanks = async () => {
  const response = await fetch(`${BASE_URL}/banks`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch banks");
  }
  return data.data; // returns array of strings
};

export default {
  uploadPDF,
  exportToCSV,
  fetchBanks,
};