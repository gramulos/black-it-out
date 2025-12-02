const DARK_CSS_FILE = "dark-theme.css";
const urlRegex = /^https?:/i;
let isEnabled = false;

const isSupportedTab = (tab) => tab?.id && tab?.url && urlRegex.test(tab.url);

const applyDarkMode = async (tabId, enable) => {
  if (!tabId) return;

  try {
    if (enable) {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: [DARK_CSS_FILE],
      });
    } else {
      await chrome.scripting.removeCSS({
        target: { tabId },
        files: [DARK_CSS_FILE],
      });
    }
  } catch (error) {
    console.warn(`Dark Toggle: unable to ${enable ? "apply" : "remove"} CSS`, error);
  }
};

const updateAllTabs = async (enable) => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.filter(isSupportedTab).map((tab) => applyDarkMode(tab.id, enable))
  );
};

const syncStateFromStorage = async () => {
  const { enabled = false } = await chrome.storage.sync.get({ enabled: false });
  isEnabled = enabled;
  if (enabled) {
    await updateAllTabs(true);
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  const { enabled } = await chrome.storage.sync.get({ enabled: false });
  if (typeof enabled === "undefined") {
    await chrome.storage.sync.set({ enabled: false });
  }
  await syncStateFromStorage();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes.enabled) return;
  isEnabled = changes.enabled.newValue;
  updateAllTabs(isEnabled);
});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (!isEnabled || info.status !== "complete" || !isSupportedTab(tab)) return;
  applyDarkMode(tabId, true);
});

const ensureSynced = () =>
  syncStateFromStorage().catch((error) =>
    console.error("Dark Toggle: failed to sync state", error)
  );

chrome.runtime.onStartup.addListener(ensureSynced);

ensureSynced();

