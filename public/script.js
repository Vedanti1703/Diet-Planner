/* script.js - Diet Planner frontend logic (improved) */

// Base URL of backend API (change if your server runs elsewhere)
const API_BASE = 'http://localhost:3000';

/**
 * debugFetch: wrapper around fetch that reads raw text, attempts JSON parse,
 * and returns { ok, status, data, raw } where data is parsed JSON or null.
 */
async function debugFetch(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const raw = await res.text();
        let data = null;
        try {
            data = raw ? JSON.parse(raw) : null;
        } catch (e) {
            // not JSON
            console.warn('debugFetch: non-JSON response from', url, '\nRaw:', raw);
        }
        return { ok: res.ok, status: res.status, data, raw, headers: res.headers };
    } catch (err) {
        console.error('debugFetch error for', url, err);
        throw err;
    }
}

// Example usage in login/signup flows (the HTML pages were updated to use fetch directly).
// Existing functions in script.js (generatePlan, loadSummary, getAIMealSuggestions, etc.)
// remain unchanged — but when saving to server we use debugFetch under the hood.

async function savePlanToServer(payload) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.warn('No auth token found. User must login to save plan.');
        return { ok: false, error: 'Not authenticated' };
    }
    try {
        const result = await debugFetch(`${API_BASE}/save-plan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(payload)
        });
        if (!result.ok) {
            console.warn('savePlanToServer server error:', result.status, result.raw || result.data);
            return { ok: false, error: result.data ? result.data.error || 'Save failed' : 'Save failed' };
        }
        return { ok: true, entry: result.data ? result.data.entry || null : null };
    } catch (err) {
        console.error('savePlanToServer network error:', err);
        return { ok: false, error: 'Network error' };
    }
}

// Keep the rest of your existing script.js functions (generatePlan, loadSummary, getAIMealSuggestions, etc.)
// If you already had those in place, they work as-is with the new debugFetch/savePlanToServer helpers.

// greeting helper (used on index)
function setGreeting() {
    console.log("setGreeting called");
    const greetingElement = document.getElementById('greeting');
    console.log("Element found:", greetingElement);

    if (!greetingElement) {
        // This is not an error, it just means we're on a page without a greeting
        console.log("No greeting element on this page.");
        return;
    }

    const hour = new Date().getHours();
    console.log("Current hour:", hour);

    let greeting;
    if (hour >= 5 && hour < 12) {
        greeting = "☀️ Good Morning!";
    } else if (hour >= 12 && hour < 18) {
        greeting = "🌞 Good Afternoon!";
    } else {
        greeting = "🌙 Good Evening!";
    }

    greetingElement.textContent = greeting;
    console.log("Greeting set to:", greeting);
}

// Use DOMContentLoaded instead of 'load'
document.addEventListener('DOMContentLoaded', function() {

    // 1. Set up the greeting
    try {
        // This function already has a check inside it
        setGreeting();
    } catch (e) {
        console.error("Error in setGreeting:", e);
    }

    // 2. Set up the AI Form Listener (if it exists on this page)
    const aiForm = document.getElementById('aiPlanForm');

    // THIS IS THE NEW SAFETY CHECK
    if (aiForm) {
        console.log("aiPlanForm found, adding listener.");
        // Only add the listener if the form element was found
        aiForm.addEventListener('submit', async e => {
            e.preventDefault();
            const prompt = document.getElementById('goals').value;
            const output = document.getElementById('aiPlanOutput');

            if (!output) {
                console.error("Could not find aiPlanOutput element!");
                return;
            }

            output.textContent = 'Generating…';

            try {
                const res = await fetch(`${API_BASE}/ai/meal-plan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                if (!res.ok) {
                    throw new Error(`Server responded with status: ${res.status}`);
                }

                const data = await res.json();
                output.textContent = data.plan;
            } catch (err) {
                output.textContent = 'Error generating plan.';
                console.error(err);
            }
        });
    } else {
        // This is normal on pages like login.html
        console.log("No aiPlanForm on this page.");
    }

    // You can add other page-specific initializers here
    // e.g., const loginForm = document.getElementById('loginForm');
    // if (loginForm) { ... }

});