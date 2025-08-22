// popup.js - Popup-Funktionalität mit Sensitivitätseinstellung

document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusDot = document.getElementById('statusDot');
    const manualButton = document.getElementById('manualSwitch');
    const infoBox = document.getElementById('infoBox');
    const sensitivityHigh = document.getElementById('sensitivityHigh');
    const sensitivityLow = document.getElementById('sensitivityLow');
    
    // Lade aktuellen Status und Einstellungen
    chrome.storage.local.get(['autoSwitch', 'chatSensitivity'], (data) => {
        if (data.autoSwitch !== undefined) {
            updateToggleUI(data.autoSwitch);
        }
        
        // Setze Sensitivität (Standard: high)
        const sensitivity = data.chatSensitivity || 'high';
        if (sensitivity === 'high') {
            sensitivityHigh.checked = true;
        } else {
            sensitivityLow.checked = true;
        }
    });
    
    // Toggle-Funktion
    toggleSwitch.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "toggleAutoSwitch" }, (response) => {
            if (response && response.autoSwitch !== undefined) {
                updateToggleUI(response.autoSwitch);
            }
        });
    });
    
    // Sensitivitäts-Einstellung
    sensitivityHigh.addEventListener('change', () => {
        if (sensitivityHigh.checked) {
            chrome.storage.local.set({ chatSensitivity: 'high' }, () => {
                showMessage("Sensitivität auf 'Hoch' gesetzt", 'success');
                // Sende Nachricht an alle Tabs
                chrome.tabs.query({ url: "*://*.claude.ai/*" }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, { 
                            action: "updateSensitivity", 
                            sensitivity: 'high' 
                        });
                    });
                });
            });
        }
    });
    
    sensitivityLow.addEventListener('change', () => {
        if (sensitivityLow.checked) {
            chrome.storage.local.set({ chatSensitivity: 'low' }, () => {
                showMessage("Sensitivität auf 'Niedrig' gesetzt", 'success');
                // Sende Nachricht an alle Tabs
                chrome.tabs.query({ url: "*://*.claude.ai/*" }, (tabs) => {
                    tabs.forEach(tab => {
                        chrome.tabs.sendMessage(tab.id, { 
                            action: "updateSensitivity", 
                            sensitivity: 'low' 
                        });
                    });
                });
            });
        }
    });
    
    // Manueller Switch
    manualButton.addEventListener('click', () => {
        manualButton.disabled = true;
        manualButton.textContent = "Wird umgeschaltet...";
        
        // Prüfe ob wir auf Claude.ai sind
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('claude.ai')) {
                chrome.runtime.sendMessage({ action: "manualSwitch" }, (response) => {
                    manualButton.disabled = false;
                    manualButton.textContent = "Jetzt auf Opus umschalten";
                    
                    if (response && response.success) {
                        showMessage("Erfolgreich auf Opus umgeschaltet!", 'success');
                    } else {
                        showMessage("Umschaltung fehlgeschlagen. Bitte versuche es erneut.", 'error');
                    }
                });
            } else {
                manualButton.disabled = false;
                manualButton.textContent = "Jetzt auf Opus umschalten";
                showMessage("Bitte öffne zuerst Claude.ai", 'error');
            }
        });
    });
    
    function updateToggleUI(isActive) {
        if (isActive) {
            toggleSwitch.classList.add('active');
            statusDot.classList.remove('inactive');
            infoBox.textContent = "Addon ist aktiv und schaltet automatisch auf Claude Opus 4 um.";
            infoBox.className = 'info';
        } else {
            toggleSwitch.classList.remove('active');
            statusDot.classList.add('inactive');
            infoBox.textContent = "Automatisches Umschalten ist deaktiviert.";
            infoBox.className = 'info';
        }
    }
    
    function showMessage(message, type) {
        infoBox.textContent = message;
        infoBox.className = `info ${type}`;
        
        // Reset nach 3 Sekunden
        setTimeout(() => {
            chrome.storage.local.get('autoSwitch', (data) => {
                if (data && data.autoSwitch !== undefined) {
                    updateToggleUI(data.autoSwitch);
                }
            });
        }, 3000);
    }
    
    // Prüfe ob wir auf Claude.ai sind
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && !tabs[0].url.includes('claude.ai')) {
            manualButton.style.opacity = '0.6';
        }
    });
});