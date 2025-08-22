// switch_to_opus.js - Optimierte Version mit verbesserter Ladeerkennung

console.log("Claude AI Opus Autoswitch: Skript wird geladen...");

// Globale Variable für Sensitivität
let currentSensitivity = 'high';

// Lade Sensitivität beim Start
chrome.storage.local.get('chatSensitivity', (data) => {
    currentSensitivity = data.chatSensitivity || 'high';
    console.log("Claude AI Opus Autoswitch: Sensitivität geladen:", currentSensitivity);
});

/**
 * Verbesserte Funktion zur Erkennung ob die Seite wirklich bereit ist
 */
async function waitForPageReady() {
    console.log("Claude AI Opus Autoswitch: Warte auf vollständiges Laden der Seite...");
    
    // Schritt 1: Warte auf DOM Content Loaded (falls noch nicht geschehen)
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }
    
    // Schritt 2: Warte auf wichtige Claude.ai Elemente
    const criticalSelectors = [
        // Modell-Selektor ist das wichtigste Element
        'button[data-testid="model-selector-dropdown"]',
        'button[aria-haspopup="menu"]',
        // Eingabefeld
        'textarea[placeholder*="Talk to Claude"], textarea[placeholder*="Message Claude"]',
        // Container für Nachrichten
        'main, [role="main"]'
    ];
    
    let foundElements = 0;
    const maxWaitTime = 30000; // 30 Sekunden Maximum
    const checkInterval = 500; // Alle 500ms prüfen
    const startTime = Date.now();
    
    while (foundElements < 2 && (Date.now() - startTime) < maxWaitTime) {
        foundElements = 0;
        
        for (const selector of criticalSelectors) {
            if (document.querySelector(selector)) {
                foundElements++;
            }
        }
        
        // Spezialprüfung: Suche Button mit Claude Text
        if (foundElements < 2) {
            const buttons = document.querySelectorAll('button');
            const claudeButton = Array.from(buttons).find(btn => {
                const text = btn.textContent || '';
                return text.includes('Claude') && (text.includes('Sonnet') || text.includes('Opus'));
            });
            if (claudeButton) foundElements++;
        }
        
        console.log(`Claude AI Opus Autoswitch: ${foundElements} kritische Elemente gefunden...`);
        
        if (foundElements < 2) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
    }
    
    // Schritt 3: Warte auf Netzwerk-Stabilität (keine aktiven Requests)
    let networkStable = false;
    let stabilityChecks = 0;
    const maxStabilityChecks = 10;
    
    while (!networkStable && stabilityChecks < maxStabilityChecks) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Prüfe ob die wichtigsten Elemente da sind und stabil bleiben
        const modelButton = document.querySelector('button[data-testid="model-selector-dropdown"]') ||
                           document.querySelector('button[aria-haspopup="menu"]') ||
                           Array.from(document.querySelectorAll('button')).find(btn => {
                               const text = btn.textContent || '';
                               return text.includes('Claude') && (text.includes('Sonnet') || text.includes('Opus'));
                           });
        
        if (modelButton) {
            // Element gefunden, prüfe ob es interaktiv ist
            const isDisabled = modelButton.disabled || modelButton.getAttribute('aria-disabled') === 'true';
            if (!isDisabled) {
                networkStable = true;
            }
        }
        
        stabilityChecks++;
    }
    
    // Schritt 4: Finale Wartezeit für React-Initialisierung
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Claude AI Opus Autoswitch: Seite ist bereit!");
}

/**
 * Prüft ob der Chat bereits Nachrichten enthält - ERWEITERTE VERSION
 * @param {string} sensitivity - 'high' oder 'low'
 */
function isChatInUse(sensitivity = currentSensitivity) {
    console.log("Claude AI Opus Autoswitch: Prüfe Chat-Status mit Sensitivität:", sensitivity);
    
    // Verschiedene Selektoren für Chat-Nachrichten - ERWEITERT
    const messageSelectors = [
        // Hauptselektoren für Nachrichten
        '[data-testid^="message-"]',
        '[data-testid="conversation-turn"]',
        '.conversation-turn',
        '[role="article"]',
        
        // NEUE ERGÄNZUNG: Spezifische Klasse für Chat-Nachrichten
        '.whitespace-normal.break-words',
        
        // Fallback: Suche nach typischen Message-Containern
        'div[class*="message"]',
        'div[class*="turn"]',
        'div[class*="chat-message"]',
        
        // Zusätzliche Selektoren für verschiedene Message-Container
        'div[class*="whitespace-normal"]',
        'div[class*="break-words"]'
    ];
    
    // Prüfe ob Nachrichten vorhanden sind
    for (const selector of messageSelectors) {
        const messages = document.querySelectorAll(selector);
        if (messages.length > 0) {
            console.log(`Claude AI Opus Autoswitch: ${messages.length} Nachrichten gefunden mit Selector: ${selector}`);
            
            // Prüfe ob es echte Nachrichten sind (nicht nur Platzhalter)
            for (const msg of messages) {
                const text = msg.textContent || '';
                // Ignoriere leere oder sehr kurze Nachrichten
                if (text.trim().length > 10) {
                    // SPEZIALPRÜFUNG für whitespace-normal break-words:
                    // Diese Klasse wird oft für echte Nachrichten verwendet
                    if (selector.includes('whitespace-normal') || selector.includes('break-words')) {
                        // Zusätzliche Validierung: Prüfe ob es wirklich eine Nachricht ist
                        const parentElement = msg.closest('[data-testid^="message-"]') || 
                                            msg.closest('[data-testid="conversation-turn"]') ||
                                            msg.closest('[role="article"]');
                        
                        if (parentElement || text.length > 50) {
                            console.log("Claude AI Opus Autoswitch: Echte Chat-Nachricht mit whitespace-normal/break-words gefunden");
                            return true;
                        }
                    } else {
                        // Bei beiden Sensitivitäten gilt: Wenn echte Nachrichten da sind, ist der Chat in Benutzung
                        return true;
                    }
                }
            }
        }
    }
    
    // ZUSÄTZLICHE PRÜFUNG: Suche nach Elementen mit beiden Klassen kombiniert
    const combinedClassElements = document.querySelectorAll('.whitespace-normal.break-words');
    if (combinedClassElements.length > 0) {
        console.log(`Claude AI Opus Autoswitch: ${combinedClassElements.length} Elemente mit kombinierter Klasse 'whitespace-normal break-words' gefunden`);
        
        for (const element of combinedClassElements) {
            const text = element.textContent || '';
            if (text.trim().length > 10) {
                // Prüfe ob es in einem Message-Container ist
                const isInMessageContainer = element.closest('[data-testid^="message-"]') || 
                                           element.closest('[data-testid="conversation-turn"]') ||
                                           element.closest('[role="article"]') ||
                                           element.closest('div[class*="message"]') ||
                                           text.length > 50; // Oder einfach längerer Text
                
                if (isInMessageContainer) {
                    console.log("Claude AI Opus Autoswitch: Echte Nachricht mit whitespace-normal break-words gefunden");
                    return true;
                }
            }
        }
    }
    
    // Bei niedriger Sensitivität prüfen wir NUR Nachrichten, nicht das Eingabefeld
    if (sensitivity === 'low') {
        console.log("Claude AI Opus Autoswitch: Niedrige Sensitivität - keine Nachrichten gefunden, Chat gilt als neu");
        return false;
    }
    
    // Bei hoher Sensitivität prüfen wir auch das Eingabefeld
    if (sensitivity === 'high') {
        // Alternative Prüfung: Suche nach dem Eingabefeld und prüfe ob es leer ist
        const inputField = document.querySelector('textarea[placeholder*="Talk to Claude"]') || 
                          document.querySelector('textarea[placeholder*="Message Claude"]') ||
                          document.querySelector('div[contenteditable="true"]');
        
        if (inputField) {
            const hasContent = (inputField.value && inputField.value.trim().length > 0) || 
                              (inputField.textContent && inputField.textContent.trim().length > 0);
            if (hasContent) {
                console.log("Claude AI Opus Autoswitch: Hohe Sensitivität - Eingabefeld enthält Text");
                return true;
            }
        }
    }
    
    // Prüfe ob die URL einen Chat-Identifier enthält
    const url = window.location.href;
    if (url.includes('/chat/') && !url.endsWith('/new')) {
        // Warte kurz um sicherzustellen, dass Nachrichten geladen wurden
        return new Promise(resolve => {
            setTimeout(() => {
                // Nochmalige Prüfung mit allen Selektoren inklusive der neuen Klassen
                const hasMessages = document.querySelectorAll('[data-testid^="message-"]').length > 0 ||
                                  document.querySelectorAll('.whitespace-normal.break-words').length > 0;
                resolve(hasMessages);
            }, 1000);
        });
    }
    
    console.log("Claude AI Opus Autoswitch: Keine Nachrichten oder Text gefunden - Chat ist neu");
    return false;
}

/**
 * Prüft ob Opus bereits ausgewählt ist - verbesserte Version
 */
function isOpusAlreadySelected() {
    // Suche nach dem Modell-Selector Button
    const selectors = [
        'button[data-testid="model-selector-dropdown"]',
        'button[aria-haspopup="menu"]',
        '[role="button"][aria-haspopup="menu"]'
    ];
    
    let modelButton = null;
    for (const selector of selectors) {
        modelButton = document.querySelector(selector);
        if (modelButton) break;
    }
    
    if (!modelButton) {
        // Fallback: Suche Button mit Claude Text
        const buttons = document.querySelectorAll('button');
        modelButton = Array.from(buttons).find(btn => {
            const text = btn.textContent || '';
            return text.includes('Claude') && (text.includes('Sonnet') || text.includes('Opus'));
        });
    }
    
    if (modelButton) {
        // Prüfe nur den Text des Buttons selbst, nicht der ganzen Seite
        const buttonText = modelButton.textContent || '';
        console.log("Claude AI Opus Autoswitch: Aktueller Button-Text:", buttonText);
        
        // Opus ist ausgewählt wenn der Button "Claude Opus 4" anzeigt
        // und NICHT "Sonnet" enthält
        return buttonText.includes('Opus 4') && !buttonText.includes('Sonnet');
    }
    
    return false;
}

/**
 * Ansatz 1: React-Props direkt manipulieren
 */
function triggerReactClick(element) {
    const reactPropsKey = Object.keys(element).find(key => 
        key.startsWith('__reactInternalInstance') || 
        key.startsWith('__reactFiber')
    );
    
    if (reactPropsKey) {
        const reactElement = element[reactPropsKey];
        let currentElement = reactElement;
        while (currentElement) {
            if (currentElement.memoizedProps?.onClick) {
                console.log("Claude AI Opus Autoswitch: React onClick gefunden");
                const fakeEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    target: element,
                    currentTarget: element,
                    type: 'click',
                    bubbles: true
                };
                currentElement.memoizedProps.onClick(fakeEvent);
                return true;
            }
            currentElement = currentElement.return;
        }
    }
    return false;
}

/**
 * Ansatz 2: Pointer Events verwenden
 */
function simulatePointerClick(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const pointerEventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        pointerId: 1,
        pointerType: 'mouse',
        isPrimary: true
    };
    
    element.dispatchEvent(new PointerEvent('pointerover', pointerEventInit));
    element.dispatchEvent(new PointerEvent('pointerenter', pointerEventInit));
    element.dispatchEvent(new PointerEvent('pointerdown', pointerEventInit));
    element.dispatchEvent(new PointerEvent('pointerup', pointerEventInit));
    element.dispatchEvent(new PointerEvent('click', pointerEventInit));
}

/**
 * Ansatz 3: Keyboard Navigation
 */
async function openDropdownWithKeyboard(element) {
    element.focus();
    
    element.dispatchEvent(new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        keyCode: 32,
        which: 32,
        bubbles: true
    }));
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    element.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40,
        which: 40,
        bubbles: true
    }));
}

/**
 * Hauptfunktion mit allen Ansätzen
 */
async function triggerDropdown(element) {
    console.log("Claude AI Opus Autoswitch: Versuche Dropdown zu öffnen...");
    
    // Ansatz 1: React Props
    if (triggerReactClick(element)) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (document.querySelector('[role="menu"]')) {
            console.log("Erfolgreich mit React-Handler!");
            return true;
        }
    }
    
    // Ansatz 2: Pointer Events
    simulatePointerClick(element);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (document.querySelector('[role="menu"]')) {
        console.log("Erfolgreich mit Pointer Events!");
        return true;
    }
    
    // Ansatz 3: Keyboard
    await openDropdownWithKeyboard(element);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (document.querySelector('[role="menu"]')) {
        console.log("Erfolgreich mit Keyboard!");
        return true;
    }
    
    return false;
}

/**
 * Hauptfunktion zum Umschalten auf Opus
 */
async function switchToOpus() {
    // Verwende die optimierte Wartefunktion
    await waitForPageReady();
    
    // NEUE PRÜFUNG: Ist der Chat bereits in Benutzung?
    const chatInUse = await isChatInUse(currentSensitivity);
    if (chatInUse) {
        console.log("Claude AI Opus Autoswitch: Chat wird bereits verwendet - kein Wechsel zu Opus");
        return;
    }
    
    // WICHTIG: Verbesserte Prüfung ob Opus bereits aktiv ist
    if (isOpusAlreadySelected()) {
        console.log("Claude AI Opus Autoswitch: Opus ist bereits aktiv!");
        notifySuccess();
        return;
    }
    
    // Finde Modell-Selector
    const selectors = [
        'button[data-testid="model-selector-dropdown"]',
        'button[aria-haspopup="menu"]',
        '[role="button"][aria-haspopup="menu"]'
    ];
    
    let modelButton = null;
    for (const selector of selectors) {
        modelButton = document.querySelector(selector);
        if (modelButton) break;
    }
    
    if (!modelButton) {
        const buttons = document.querySelectorAll('button');
        modelButton = Array.from(buttons).find(btn => {
            const text = btn.textContent || '';
            return text.includes('Claude') && (text.includes('Sonnet') || text.includes('Opus'));
        });
    }
    
    if (!modelButton) {
        console.log("Claude AI Opus Autoswitch: Kein Modell-Button gefunden.");
        return;
    }
    
    // Versuche Dropdown zu öffnen
    const success = await triggerDropdown(modelButton);
    
    if (!success) {
        console.log("Claude AI Opus Autoswitch: Dropdown konnte nicht geöffnet werden.");
        return;
    }
    
    // Warte kurz und suche Opus-Option
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const menuItems = document.querySelectorAll('[role="menuitem"], [role="option"]');
    const opusItem = Array.from(menuItems).find(item => 
        item.textContent.includes('Claude Opus 4') && 
        !item.textContent.includes('Sonnet')
    );
    
    if (opusItem) {
        if (triggerReactClick(opusItem)) {
            console.log("Claude AI Opus Autoswitch: Opus mit React-Click ausgewählt!");
        } else {
            simulatePointerClick(opusItem);
            console.log("Claude AI Opus Autoswitch: Opus mit Pointer-Click ausgewählt!");
        }
        
        // Warte kurz und prüfe ob erfolgreich
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (isOpusAlreadySelected()) {
            notifySuccess();
        }
    }
}

// Globale Variable um mehrfache Ausführungen zu verhindern
let isProcessing = false;
let attempts = 0;
const maxAttempts = 5;

async function attemptSwitch(forceSwitch = false) {
    if (isProcessing) {
        console.log("Claude AI Opus Autoswitch: Bereits in Bearbeitung, überspringe...");
        return;
    }
    
    if (attempts >= maxAttempts) {
        console.log("Claude AI Opus Autoswitch: Maximale Versuche erreicht.");
        isProcessing = false;
        return;
    }
    
    // Bei manuellem Switch ignorieren wir die Chat-Prüfung
    if (!forceSwitch) {
        // NEUE PRÜFUNG: Ist der Chat bereits in Benutzung?
        const chatInUse = await isChatInUse(currentSensitivity);
        if (chatInUse) {
            console.log("Claude AI Opus Autoswitch: Chat wird bereits verwendet - kein automatischer Wechsel");
            isProcessing = false;
            attempts = 0;
            return;
        }
    }
    
    // Prüfe zuerst ob Opus bereits ausgewählt ist
    if (isOpusAlreadySelected()) {
        console.log("Claude AI Opus Autoswitch: Opus ist bereits ausgewählt, beende.");
        notifySuccess();
        return;
    }
    
    isProcessing = true;
    attempts++;
    console.log(`Claude AI Opus Autoswitch: Versuch ${attempts}/${maxAttempts}`);
    
    switchToOpus().then(() => {
        // Prüfe nach 2 Sekunden ob erfolgreich
        setTimeout(() => {
            if (!isOpusAlreadySelected()) {
                // Nicht erfolgreich, erneut versuchen
                isProcessing = false;
                setTimeout(() => attemptSwitch(forceSwitch), 3000);
            } else {
                console.log("Claude AI Opus Autoswitch: Erfolgreich auf Opus umgeschaltet!");
                isProcessing = false;
                attempts = 0; // Reset für nächstes Mal
            }
        }, 2000);
    }).catch(error => {
        console.error("Claude AI Opus Autoswitch: Fehler beim Umschalten:", error);
        isProcessing = false;
    });
}

// Message Handler für Background Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkAndSwitch") {
        chrome.storage.local.get(['autoSwitch', 'chatSensitivity'], (data) => {
            currentSensitivity = data.chatSensitivity || 'high';
            if (data.autoSwitch !== false) {
                attemptSwitch(false);
            }
        });
        sendResponse({ status: "started" });
    }
    
    if (request.action === "forceSwitch") {
        // Bei manuellem Switch ignorieren wir die Chat-Prüfung
        attempts = 0;
        isProcessing = false;
        attemptSwitch(true); // forceSwitch = true
        
        setTimeout(() => {
            const success = isOpusAlreadySelected();
            sendResponse({ success: success });
        }, 3000);
        
        return true;
    }
    
    if (request.action === "updateSensitivity") {
        currentSensitivity = request.sensitivity;
        console.log("Claude AI Opus Autoswitch: Sensitivität aktualisiert auf:", currentSensitivity);
        sendResponse({ status: "updated" });
    }
});

// Frühzeitige Initialisierung - versuche sofort nach Skript-Laden
(async function earlyInit() {
    console.log("Claude AI Opus Autoswitch: Frühe Initialisierung...");
    
    // Warte minimal auf DOM
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }
    
    // Prüfe Settings und starte wenn aktiviert
    chrome.storage.local.get(['autoSwitch', 'chatSensitivity'], (data) => {
        currentSensitivity = data.chatSensitivity || 'high';
        if (data.autoSwitch !== false) {
            // Starte den ersten Versuch
            attemptSwitch(false);
        }
    });
})();

// Beobachte DOM-Änderungen für dynamisch geladene Elemente
const observer = new MutationObserver(async (mutations) => {
    // Prüfe ob wichtige Elemente hinzugefügt wurden
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Prüfe ob es der Modell-Button ist
                    const isModelButton = node.matches && (
                        node.matches('button[data-testid="model-selector-dropdown"]') ||
                        node.matches('button[aria-haspopup="menu"]') ||
                        (node.tagName === 'BUTTON' && node.textContent && 
                         (node.textContent.includes('Sonnet') || node.textContent.includes('Opus')))
                    );
                    
                    if (isModelButton && attempts === 0 && !isProcessing) {
                        console.log("Claude AI Opus Autoswitch: Modell-Button dynamisch geladen!");
                        
                        // Prüfe ob es ein neuer Chat ist
                        const chatInUse = await isChatInUse(currentSensitivity);
                        if (!chatInUse) {
                            chrome.storage.local.get(['autoSwitch', 'chatSensitivity'], (data) => {
                                currentSensitivity = data.chatSensitivity || 'high';
                                if (data.autoSwitch !== false && !isOpusAlreadySelected()) {
                                    attemptSwitch(false);
                                }
                            });
                        }
                    }
                }
            }
        }
    }
});

// Starte Observer früh
observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

// Speichere erfolgreiche Umschaltung
function notifySuccess() {
    chrome.storage.local.set({ 
        lastSwitchTime: new Date().toISOString() 
    });
    attempts = 0;
    isProcessing = false;
}