
// Tech Connect Alberta — script.js
// This file controls two main things:
//   1. Switching between pages (we built this as a single HTML
//      file, so instead of loading new pages, we just show/hide
//      different sections — that's what switchPage() does)
//   2. The AI chat widget on the homepage — sends messages to
//      our backend (/api/chat.js) which talks to Groq


// Wait until the entire page has loaded before running anything
window.addEventListener('DOMContentLoaded', () => {
    console.log("Tech Connect Alberta loaded.");
});



// PAGE SWITCHER
// Because everything lives in one HTML file, we fake navigation
// by hiding all sections and only showing the one the user
// clicked on. Each "page" is a <main> tag with a unique ID.

function switchPage(pageId) {

    // Every page section in the app, mapped by their ID
    const views = {
        'home':        document.getElementById('home-view'),
        'join':        document.getElementById('join-view'),
        'events':      document.getElementById('events-view'),
        'consulting':  document.getElementById('consulting-view'),
        'find-talent': document.getElementById('find-talent-view'),
        'talent-pool': document.getElementById('talent-pool-view'),
        'mission':     document.getElementById('mission-view'),
        'volunteer':   document.getElementById('volunteer-view'),
        'projects':    document.getElementById('projects-view'),
        'partners':    document.getElementById('partners-view'),
        'team':        document.getElementById('team-view'),
        'newsletter':  document.getElementById('newsletter-view')
    };

    // Grab the two nav buttons that can have an "active" highlight
    const navHome = document.getElementById('nav-home');
    const navJoin = document.getElementById('nav-join');

    // Hide every single page first — we'll reveal only the target one below
    Object.values(views).forEach(v => { if (v) v.classList.add('hidden-view'); });

    // Remove the active highlight from both nav buttons
    if (navHome) navHome.classList.remove('active-nav');
    if (navJoin) navJoin.classList.remove('active-nav');

    // Show the page the user actually clicked on
    if (views[pageId]) {
        views[pageId].classList.remove('hidden-view');

        // Re-trigger the fade-in animation every time a page opens
        // (removing and re-adding the class forces the browser to replay it)
        views[pageId].classList.remove('animate-fade');
        void views[pageId].offsetWidth; // this line forces the browser to notice the class was removed
        views[pageId].classList.add('animate-fade');

        // Highlight the correct nav button
        if (pageId === 'home' && navHome) navHome.classList.add('active-nav');
        if (pageId === 'join' && navJoin) navJoin.classList.add('active-nav');

        // Scroll back to the top so users don't land in the middle of a page
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`View not found: ${pageId}`);
    }
}



// AI CHAT WIDGET
// The chat widget on the homepage talks to our own backend
// at /api/chat.js — we never call Groq directly from here
// because that would expose our API key to anyone who opens
// the browser dev tools.
//
// We keep the full conversation history in memory so the AI
// remembers what was said earlier in the same session.


// Stores the full back-and-forth conversation so the AI has context
const conversationHistory = [];

// Sends the user's message to our backend and gets the AI reply back
async function callClaudeAPI(userMessage) {

    // Add the user's message to the conversation history before sending
    conversationHistory.push({ role: 'user', content: userMessage });

    // POST to our Vercel serverless function — the API key lives there, not here
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.reply || "Sorry, I couldn't generate a response.";

    // Save the AI's reply to history so future messages have full context
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
}

// Adds a message bubble to the chat window (works for both user and AI)
function appendMessage(role, text) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;

    const isAgent = role === 'agent';

    // Build the message row: avatar + bubble side by side
    const wrapper = document.createElement('div');
    wrapper.className = `chat-msg ${isAgent ? 'agent' : 'user'}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${isAgent ? 'agent-avatar' : 'user-avatar'}`;
    avatar.textContent = isAgent ? 'TC' : 'You';

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${isAgent ? 'agent-bubble' : 'user-bubble'}`;
    bubble.textContent = text;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    chatWindow.appendChild(wrapper);

    // Auto-scroll to the bottom so the latest message is always visible
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Shows the "..." bouncing dots while we wait for the AI to respond
function showTyping() {
    const chatWindow = document.getElementById('chatWindow');
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg agent';
    wrapper.id = 'typingIndicator'; // give it an ID so we can remove it later

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar agent-avatar';
    avatar.textContent = 'TC';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(indicator);
    chatWindow.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Removes the typing dots once the AI has replied
function removeTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

// Main function that runs when the user hits Send (or presses Enter)
async function sendMessage() {
    const input = document.getElementById('agentInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickPrompts = document.getElementById('quickPrompts');

    if (!input) return;
    const text = input.value.trim();
    if (!text) return; // don't send empty messages

    // Hide the quick-prompt chips after the user sends their first real message
    if (quickPrompts) quickPrompts.style.display = 'none';

    // Disable input while waiting so the user can't spam send
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    // Show what the user typed, then show typing dots while we wait
    appendMessage('user', text);
    showTyping();

    try {
        const reply = await callClaudeAPI(text);
        removeTyping();
        appendMessage('agent', reply);
    } catch (err) {
        // If something goes wrong, show a friendly fallback message
        removeTyping();
        appendMessage('agent', "I'm having a bit of trouble connecting right now. For immediate help, reach out via our Discord or WhatsApp community channels!");
        console.error('AI Agent error:', err);
    } finally {
        // Always re-enable the input after a response (or error)
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send →';
        input.focus();
    }
}

// Called when the user clicks one of the quick-prompt chip buttons
// It just pre-fills the input with that text and fires sendMessage()
function sendQuick(message) {
    const input = document.getElementById('agentInput');
    if (input) {
        input.value = message;
        sendMessage();
    }
}



// FEEDBACK & REVIEWS SYSTEM
// Users can leave a star rating + written review on the Join Us
// page. Reviews are saved to localStorage so they persist between
// visits on the same device. We pre-load 3 starter reviews so the
// section doesn't look empty on a brand new visitor's screen.


// Tracks which star the user has selected (1–5), starts at 0 (none)
let currentRating = 0;

// These show up by default until real users leave their own reviews
const defaultReviews = [
    { name: 'Sarah K.', role: 'Job Seeker', rating: 5, text: 'Tech Connect helped me land my first dev role in Calgary within six weeks of joining. The community is genuinely supportive!', date: 'June 2025' },
    { name: 'Marcus T.', role: 'Nonprofit Partner', rating: 5, text: "We needed a website rebuild but couldn't afford an agency. Tech Connect's consulting team delivered something amazing at no cost.", date: 'May 2025' },
    { name: 'Priya N.', role: 'Community Member', rating: 5, text: 'As a newcomer to Alberta, this community gave me the contacts and confidence I needed. Truly life-changing.', date: 'April 2025' }
];

// Highlights stars up to the one the user clicked
function setRating(val) {
    currentRating = val;
    document.querySelectorAll('.star').forEach((star, i) => {
        star.textContent = i < val ? '★' : '☆'; // filled vs empty star
        star.style.color = i < val ? '#d15b47' : '#cbd5e1';
    });
}

// Runs when the user submits the feedback form
function submitFeedback(e) {
    e.preventDefault(); // stop the page from reloading

    const name = document.getElementById('feedbackName').value.trim() || 'Anonymous';
    const role = document.getElementById('feedbackRole').value;
    const text = document.getElementById('feedbackText').value.trim();

    // Basic validation — need text and a star rating
    if (!text) { alert('Please write some feedback before submitting.'); return; }
    if (!currentRating) { alert('Please select a star rating.'); return; }

    // Add the new review to the top of the list and save to localStorage
    const reviews = getReviews();
    reviews.unshift({
        name, role, rating: currentRating, text,
        date: new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
    });
    localStorage.setItem('tca_reviews', JSON.stringify(reviews));

    // Immediately show the new review without reloading
    renderReviews();

    // Reset the form back to empty
    document.getElementById('feedbackText').value = '';
    document.getElementById('feedbackName').value = '';
    currentRating = 0;
    setRating(0);

    alert('Thank you for your feedback! 🎉');
}

// Gets saved reviews from localStorage, falls back to the defaults
// if nothing is saved yet (e.g. first-time visitor)
function getReviews() {
    try {
        const stored = localStorage.getItem('tca_reviews');
        return stored ? JSON.parse(stored) : [...defaultReviews];
    } catch {
        return [...defaultReviews];
    }
}

// Builds and injects the review cards into the page
function renderReviews() {
    const list = document.getElementById('reviewsList');
    if (!list) return;

    const reviews = getReviews();
    list.innerHTML = reviews.map(r => `
        <div style="background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <div>
                    <strong style="font-size:0.95rem; color:#0f172a;">${r.name}</strong>
                    <span style="font-size:0.8rem; color:var(--brand-orange); font-weight:600; margin-left:0.5rem;">${r.role}</span>
                </div>
                <div>
                    ${'★'.repeat(r.rating)}<span style="color:#e2e8f0">${'★'.repeat(5 - r.rating)}</span>
                    <span style="font-size:0.78rem; color:var(--muted-gray); margin-left:0.5rem;">${r.date}</span>
                </div>
            </div>
            <p style="color:#475569; font-size:0.9rem; line-height:1.6; margin:0;">${r.text}</p>
        </div>
    `).join('');
}

// We wrap the original switchPage so that every time someone opens
// the Join Us page, we also render the latest reviews automatically
const origSwitchPage = switchPage;
window.switchPage = function(pageId) {
    origSwitchPage(pageId);
    if (pageId === 'join') {
        setTimeout(renderReviews, 100); // small delay to let the page finish appearing
    }
};
