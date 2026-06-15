// ============================================================
// Tech Connect Alberta — script.js
// ============================================================
 
window.addEventListener('DOMContentLoaded', () => {
    console.log("Tech Connect Alberta loaded.");
});
 
// ============================================================
// SPA PAGE SWITCHER
// ============================================================
function switchPage(pageId) {
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
 
    const navHome = document.getElementById('nav-home');
    const navJoin = document.getElementById('nav-join');
 
    // Hide all views
    Object.values(views).forEach(v => { if (v) v.classList.add('hidden-view'); });
 
    // Remove active nav states
    if (navHome) navHome.classList.remove('active-nav');
    if (navJoin) navJoin.classList.remove('active-nav');
 
    // Show target view
    if (views[pageId]) {
        views[pageId].classList.remove('hidden-view');
        // Re-trigger fade animation
        views[pageId].classList.remove('animate-fade');
        void views[pageId].offsetWidth; // reflow
        views[pageId].classList.add('animate-fade');
 
        if (pageId === 'home' && navHome) navHome.classList.add('active-nav');
        if (pageId === 'join' && navJoin) navJoin.classList.add('active-nav'); // BUG FIX: was .add() instead of .classList.add()
 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`View not found: ${pageId}`);
    }
}
 
// ============================================================
// AI AGENT — REAL CLAUDE-POWERED CHAT
// ============================================================
 
 
// Conversation history for context
const conversationHistory = [];
 
async function callClaudeAPI(userMessage) {
    conversationHistory.push({ role: 'user', content: userMessage });
 
    // Calls our secure Vercel serverless function — API key never exposed to the browser
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
 
    conversationHistory.push({ role: 'assistant', content: reply });
    return reply;
}
 
function appendMessage(role, text) {
    const chatWindow = document.getElementById('chatWindow');
    if (!chatWindow) return;
 
    const isAgent = role === 'agent';
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
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
 
function showTyping() {
    const chatWindow = document.getElementById('chatWindow');
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg agent';
    wrapper.id = 'typingIndicator';
 
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
 
function removeTyping() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}
 
async function sendMessage() {
    const input = document.getElementById('agentInput');
    const sendBtn = document.getElementById('sendBtn');
    const quickPrompts = document.getElementById('quickPrompts');
 
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
 
    // Hide quick prompts after first message
    if (quickPrompts) quickPrompts.style.display = 'none';
 
    // UI state
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = '...';
 
    // Show user message
    appendMessage('user', text);
    showTyping();
 
    try {
        const reply = await callClaudeAPI(text);
        removeTyping();
        appendMessage('agent', reply);
    } catch (err) {
        removeTyping();
        appendMessage('agent', "I'm having a bit of trouble connecting right now. For immediate help, reach out via our Discord or WhatsApp community channels!");
        console.error('AI Agent error:', err);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send →';
        input.focus();
    }
}
 
function sendQuick(message) {
    const input = document.getElementById('agentInput');
    if (input) {
        input.value = message;
        sendMessage();
    }
}
 