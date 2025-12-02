const toggle = document.getElementById("dark-toggle");
const statusText = document.getElementById("status-text");

chrome.storage.sync.get({ enabled: false }, ({ enabled }) => {
  toggle.checked = enabled;
  statusText.textContent = enabled ? "Dark mode is ON" : "Dark mode is OFF";
});

toggle.addEventListener("change", async () => {
  const enabled = toggle.checked;
  statusText.textContent = enabled ? "Dark mode is ON" : "Dark mode is OFF";
  await chrome.storage.sync.set({ enabled });
});

