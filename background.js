// background.js - Optimiertes Hintergrund-Script mit verbesserter Ladeerkennung

console.log("Claude AI Opus Autoswitch: Background script geladen");

// Globale Variable für bereits verarbeitete Tabs
const processedTabs = new Set();

// Funktion um Content Script zu injizieren
async function injectContentScript(tabId) {
    try {
        await chrome.tabs.executeScript(tabId, {
            file: 'switch_to_opus.js',
            runAt: 'document_start' // Früher injizieren
        });
        console.log(`Content Script in Tab ${tabId} injiziert`);
        return true;
    } catch (error) {
        console.error(`Fehler beim Injizieren in Tab ${tabId}:`, error);
        return false;
    }
}

// Überwache Tab-Updates mit verbesserter Logik
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Prüfe ob es eine Claude.ai URL ist
    if (!tab.url || !tab.url.includes('claude.ai')) {
        return;
    }
    
    console.log(`Tab ${tabId} Update:`, changeInfo.status, tab.url);
    
    // Bei Navigation innerhalb von Claude.ai
    if (changeInfo.url && changeInfo.url.includes('claude.ai')) {
        console.log("Claude AI Opus Autoswitch: Navigation erkannt");
        
        // Entferne Tab aus processed Liste bei neuer Navigation
        processedTabs.delete(tabId);
        
        // Warte kurz und sende dann Nachricht
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: "checkAndSwitch"
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("Content Script noch nicht bereit, injiziere es...");
                    injectContentScript(tabId).then(success => {
                        if (success) {
                            // Versuche erneut nach Injektion
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabId, {
                                    action: "checkAndSwitch"
                                });
                            }, 500);
                        }
                    });
                }
            });
        }, 1000);
    }
    
    // Verschiedene Status-Checks für bessere Erkennung
    if (changeInfo.status === 'loading' && tab.url.includes('claude.ai')) {
        // Stelle sicher, dass Content Script früh geladen wird
        await injectContentScript(tabId);
    }
    
    if (changeInfo.status === 'complete' && tab.url.includes('claude.ai')) {
        // Verhindere mehrfache Verarbeitung desselben Tabs
        if (processedTabs.has(tabId)) {
            console.log(`Tab ${tabId} bereits verarbeitet, überspringe...`);
            return;
        }
        
        processedTabs.add(tabId);
        console.log("Claude AI Opus Autoswitch: Claude.ai Tab vollständig geladen");
        
        // Mehrere Versuche mit unterschiedlichen Timings
        const attempts = [500, 2000, 5000]; // ms
        
        for (let i = 0; i < attempts.length; i++) {
            setTimeout(() => {
                chrome.tabs.sendMessage(tabId, {
                    action: "checkAndSwitch"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log(`Versuch ${i + 1}/${attempts.length} fehlgeschlagen:`, chrome.runtime.lastError.message);
                        
                        // Beim letzten Versuch: Content Script neu injizieren
                        if (i === attempts.length - 1) {
                            injectContentScript(tabId).then(success => {
                                if (success) {
                                    setTimeout(() => {
                                        chrome.tabs.sendMessage(tabId, {
                                            action: "checkAndSwitch"
                                        });
                                    }, 1000);
                                }
                            });
                        }
                    } else {
                        console.log(`Versuch ${i + 1} erfolgreich`);
                    }
                });
            }, attempts[i]);
        }
    }
});

// Überwache Web Navigation für bessere Erkennung
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.url && details.url.includes('claude.ai') && details.frameId === 0) {
        console.log("WebNavigation completed:", details.url);
        
        // Zusätzlicher Trigger nach Navigation
        setTimeout(() => {
            chrome.tabs.sendMessage(details.tabId, {
                action: "checkAndSwitch"
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log("WebNavigation: Content Script nicht bereit");
                }
            });
        }, 2000);
    }
}, {
    url: [{ hostContains: 'claude.ai' }]
});

// DOM Content Loaded Event
chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (details.url && details.url.includes('claude.ai') && details.frameId === 0) {
        console.log("DOM Content Loaded:", details.url);
        
        // Früher Trigger
        chrome.tabs.sendMessage(details.tabId, {
            action: "checkAndSwitch"
        });
    }
}, {
    url: [{ hostContains: 'claude.ai' }]
});

// History State Updated (für Single Page App Navigation)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.url && details.url.includes('claude.ai') && details.frameId === 0) {
        console.log("History State Updated:", details.url);
        
        // Reset processed status
        processedTabs.delete(details.tabId);
        
        setTimeout(() => {
            chrome.tabs.sendMessage(details.tabId, {
                action: "checkAndSwitch"
            });
        }, 1500);
    }
}, {
    url: [{ hostContains: 'claude.ai' }]
});

// Speichere Einstellungen bei Installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        autoSwitch: true,
        chatSensitivity: 'high',
        retryAttempts: 5,
        retryDelay: 2000
    });
    
    // Injiziere Content Script in alle existierenden Claude.ai Tabs
    chrome.tabs.query({ url: "*://*.claude.ai/*" }, (tabs) => {
        tabs.forEach(tab => {
            injectContentScript(tab.id);
        });
    });
});

// Tab entfernt - Cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
    processedTabs.delete(tabId);
});

// Nachrichtenhandler für Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getStatus") {
        chrome.storage.local.get(['autoSwitch', 'lastSwitchTime', 'chatSensitivity'], (data) => {
            sendResponse(data);
        });
        return true;
    }
    
    if (request.action === "toggleAutoSwitch") {
        chrome.storage.local.get('autoSwitch', (data) => {
            const newValue = !data.autoSwitch;
            chrome.storage.local.set({ autoSwitch: newValue }, () => {
                sendResponse({ autoSwitch: newValue });
            });
        });
        return true;
    }
    
    if (request.action === "manualSwitch") {
        // Hole aktiven Tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('claude.ai')) {
                // Stelle sicher, dass Content Script geladen ist
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "forceSwitch"
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Content Script nicht geladen, injiziere es
                        injectContentScript(tabs[0].id).then(success => {
                            if (success) {
                                setTimeout(() => {
                                    chrome.tabs.sendMessage(tabs[0].id, {
                                        action: "forceSwitch"
                                    }, sendResponse);
                                }, 500);
                            } else {
                                sendResponse({ success: false });
                            }
                        });
                    } else {
                        sendResponse(response);
                    }
                });
            } else {
                sendResponse({ success: false, error: "Nicht auf Claude.ai" });
            }
        });
        return true;
    }
    
    // Log vom Content Script
    if (request.action === "log") {
        console.log("Content Script:", request.message);
    }
});

// Beim Start: Prüfe alle Claude.ai Tabs
chrome.tabs.query({ url: "*://*.claude.ai/*" }, (tabs) => {
    tabs.forEach(tab => {
        console.log(`Gefundener Claude.ai Tab: ${tab.id}`);
        // Sende Nachricht an existierende Tabs
        chrome.tabs.sendMessage(tab.id, {
            action: "checkAndSwitch"
        }, (response) => {
            if (chrome.runtime.lastError) {
                // Content Script nicht geladen, injiziere es
                injectContentScript(tab.id);
            }
        });
    });
});