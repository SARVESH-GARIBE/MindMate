/* MindMate Chat - Client-side behavior */
(function () {
    'use strict';

    const STORAGE_KEY = 'mindmate_conversations_v1';
    const ACTIVE_KEY = 'mindmate_active_conversation_id';

    /** Utilities **/
    function nowIso() { return new Date().toISOString(); }
    function formatTime(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    }
    function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

    function readStore() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    }
    function writeStore(conversations) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
    function getActiveId() { return localStorage.getItem(ACTIVE_KEY); }
    function setActiveId(id) { localStorage.setItem(ACTIVE_KEY, id); }

    function getConversation(conversations, id) {
        return conversations.find(c => c.id === id);
    }

    /** State **/
    let conversations = readStore();
    if (!Array.isArray(conversations) || conversations.length === 0) {
        conversations = [createNewConversation('Welcome to MindMate')];
        writeStore(conversations);
        setActiveId(conversations[0].id);
    }
    let activeConversationId = getActiveId() || conversations[0].id;

    /** DOM **/
    const listEl = document.getElementById('conversation-list');
    const messagesEl = document.getElementById('messages');
    const composerEl = document.getElementById('composer');
    const inputEl = document.getElementById('message-input');
    const clearBtn = document.getElementById('clear-conversation');
    const newChatBtn = document.getElementById('new-chat');
    const newButton = document.getElementById('new-conversation');
    const deleteBtn = document.getElementById('delete-conversation');
    const toggleConversations = document.getElementById('toggle-conversations');
    const themeToggleBtn = document.getElementById('theme-toggle');

    // Lottie fallback detection
    window.addEventListener('load', () => {
        const lottie = document.getElementById('lottie-avatar');
        if (!lottie || typeof lottie.play !== 'function') {
            document.body.classList.add('no-lottie');
        }
    });


    function setupThemeToggle() {
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');

    // Set initial theme based on local storage- dark mode
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleBtn.setAttribute('aria-pressed', 'true');
        themeToggleBtn.textContent = '☀️';
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDarkMode = body.classList.toggle('dark-mode');
        if (isDarkMode) {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.setAttribute('aria-pressed', 'true');
            themeToggleBtn.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.setAttribute('aria-pressed', 'false');
            themeToggleBtn.textContent = '🌙';
        }
    });
}
setupThemeToggle(); //calling the fucntion of dark mode


    /** Initialization **/
    renderConversationList();
    renderActiveConversation();

    /** Events **/
    composerEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = (inputEl.value || '').trim();
        if (!text) return;
        sendUserMessage(text);
        inputEl.value = '';
    });

    newButton.addEventListener('click', () => {
        const conv = createNewConversation('New conversation');
        conversations.unshift(conv);
        writeStore(conversations);
        setActiveId(conv.id);
        activeConversationId = conv.id;
        renderConversationList();
        renderActiveConversation();
        inputEl.focus();
    });

    toggleConversations.addEventListener('click', () => {
        const expanded = toggleConversations.getAttribute('aria-expanded') === 'true';
        const next = !expanded;
        toggleConversations.setAttribute('aria-expanded', String(next));
        document.querySelector('.sidebar').style.display = next ? 'block' : 'none';
    });

    clearBtn?.addEventListener('click', () => {
        const conv = getConversation(conversations, activeConversationId);
        if (!conv) return;
        conv.messages = [
            { id: uid(), role: 'bot', text: 'Conversation cleared. How can I help now?', timestamp: nowIso() }
        ];
        writeStore(conversations);
        renderActiveConversation();
    });

    newChatBtn?.addEventListener('click', () => {
        const conv = createNewConversation('New conversation');
        conversations.unshift(conv);
        writeStore(conversations);
        setActiveId(conv.id);
        activeConversationId = conv.id;
        renderConversationList();
        renderActiveConversation();
        inputEl.focus();
    });
    
    deleteBtn?.addEventListener('click', () => {
        const idx = conversations.findIndex(c => c.id === activeConversationId);
        if (idx === -1) return;
        conversations.splice(idx, 1);
        if (conversations.length === 0) {
            const conv = createNewConversation('New conversation');
            conversations = [conv];
        }
        writeStore(conversations);
        activeConversationId = conversations[0].id;
        setActiveId(activeConversationId);
        renderConversationList();
        renderActiveConversation();
    });
    
    // Set dark theme by default
    document.documentElement.classList.add('theme-dark');
    localStorage.setItem('theme', 'dark');

    listEl.addEventListener('click', (e) => {
        const item = e.target.closest('[data-id]');
        if (!item) return;
        const id = item.getAttribute('data-id');
        setActiveId(id); activeConversationId = id;
        renderConversationList();
        renderActiveConversation();
    });

    /** Core functions **/
    function createNewConversation(title) {
        const id = uid();
        return {
            id,
            title,
            createdAt: nowIso(),
            messages: [
                { id: uid(), role: 'bot', text: 'Hi! I\'m MindMate. How can I help today?', timestamp: nowIso() }
            ]
        };
    }

    function renderConversationList() {
        listEl.innerHTML = '';
        const frag = document.createDocumentFragment();
        const items = conversations.map(c => ({
            id: c.id,
            title: c.title || 'Conversation',
            last: c.messages[c.messages.length - 1]?.text || '',
            when: c.messages[c.messages.length - 1]?.timestamp
        }));
        for (const it of items) {
            const li = document.createElement('li');
            li.className = 'conversation-item';
            li.setAttribute('data-id', it.id);
            li.setAttribute('role', 'option');
            const selected = activeConversationId === it.id;
            li.setAttribute('aria-selected', String(selected));
            li.innerHTML = `
        <div>
          <div class="conversation-title">${escapeHtml(it.title)}</div>
          <div class="conversation-meta">${escapeHtml(truncate(it.last, 36))}${it.when ? ' • ' + formatTime(it.when) : ''}</div>
        </div>
      `;
            frag.appendChild(li);
        }
        listEl.appendChild(frag);
    }

    function renderActiveConversation() {
        messagesEl.innerHTML = '';
        const conv = getConversation(conversations, activeConversationId);
        if (!conv) return;
        const frag = document.createDocumentFragment();
        for (const m of conv.messages) {
            frag.appendChild(createMessageEl(m));
        }
        messagesEl.appendChild(frag);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function createMessageEl(msg) {
    const wrap = document.createElement('div');
    wrap.className = `message ${msg.role}`;

    // Add avatar for bot messages
    if (msg.role === 'bot') {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';

        // Create the Lottie player element
        const lottiePlayer = document.createElement('lottie-player');
        lottiePlayer.setAttribute('id', 'lottie-avatar');
        lottiePlayer.setAttribute('src', 'https://assets2.lottiefiles.com/packages/lf20_zrqthn6o.json');
        lottiePlayer.setAttribute('background', 'transparent');
        lottiePlayer.setAttribute('speed', '1');
        lottiePlayer.setAttribute('style', 'width: 80px; height: 80px;');
        lottiePlayer.setAttribute('loop', '');
        lottiePlayer.setAttribute('autoplay', '');

        // Create the SVG fallback
        const fallbackAvatar = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        fallbackAvatar.setAttribute('class', 'fallback-avatar');
        fallbackAvatar.setAttribute('viewBox', '0 0 100 100');
        fallbackAvatar.setAttribute('width', '80');
        fallbackAvatar.setAttribute('height', '80');
        fallbackAvatar.innerHTML = `
            <circle cx="50" cy="50" r="45" fill="#4CAF50" />
            <circle cx="35" cy="40" r="8" fill="#fff" />
            <circle cx="65" cy="40" r="8" fill="#fff" />
            <path d="M35,70 Q50,85 65,70" stroke="#fff" stroke-width="4" fill="none" />
        `;

        avatar.appendChild(lottiePlayer);
        avatar.appendChild(fallbackAvatar);
        wrap.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = msg.text;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${msg.role === 'bot' ? 'MindMate' : 'You'} • ${formatTime(msg.timestamp)}`;
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    return wrap;
}

    function sendUserMessage(text) {
        const conv = getConversation(conversations, activeConversationId);
        if (!conv) return;
        const userMsg = { id: uid(), role: 'user', text, timestamp: nowIso() };
        conv.messages.push(userMsg);
        writeStore(conversations);
        appendMessageToUI(userMsg);
        syncToBackend(userMsg).finally(() => triggerBotReply(conv));
    }

    function appendMessageToUI(msg) {
        messagesEl.appendChild(createMessageEl(msg));
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Groq API key
    const GROQ_API_KEY = "YOUR_SECURELY_STORED_API_KEY_GOES_HERE"; // Replace with your actual Groq API key
    const GROQ_MODEL = "llama-3.1-8b-instant";
    
    // System message for the psychologist role
    const SYSTEM_MESSAGE = "You are a psychologist";
    
    function triggerBotReply(conv) {
        const typingEl = document.createElement('div');
        typingEl.className = 'message bot';
        typingEl.setAttribute('aria-live', 'polite');
        typingEl.innerHTML = `
      <div class="bubble"><span class="typing" aria-label="MindMate is typing">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </span></div>
      <div class="meta">MindMate • typing…</div>
    `;
        messagesEl.appendChild(typingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Get the last user message
        const lastUserMessage = conv.messages[conv.messages.length - 1]?.text || "";
        
        // Call Groq API directly from the frontend
        callGroqAPI(lastUserMessage, conv)
            .then(botText => {
                typingEl.remove();
                const botMsg = { id: uid(), role: 'bot', text: botText, timestamp: nowIso() };
                conv.messages.push(botMsg);
                writeStore(conversations);
                appendMessageToUI(botMsg);
            })
            .catch(error => {
                console.error("Groq API error:", error);
                typingEl.remove();
                // Fallback to rule-based responses if API fails
                const botText = generateBotReply(conv);
                const botMsg = { id: uid(), role: 'bot', text: botText, timestamp: nowIso() };
                conv.messages.push(botMsg);
                writeStore(conversations);
                appendMessageToUI(botMsg);
            });
    }
    
    // Function to call Groq API
    async function callGroqAPI(userMessage, conv) {
        try {
            // Format conversation history for the API
            const messages = [
                { role: "system", content: SYSTEM_MESSAGE }
            ];
            
            // Add conversation history (up to last 10 messages)
            const historyMessages = conv.messages.slice(-10);
            for (const msg of historyMessages) {
                if (msg.role === 'user') {
                    messages.push({ role: "user", content: msg.text });
                } else if (msg.role === 'bot') {
                    messages.push({ role: "assistant", content: msg.text });
                }
            }
            
            // Add the current user message if it's not already included
            if (messages[messages.length - 1]?.role !== "user") {
                messages.push({ role: "user", content: userMessage });
            }
            
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: messages
                })
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error("Error calling Groq API:", error);
            throw error;
        }
    }

    // Microphone input via Web Speech API
    const micBtn = document.getElementById('audio-note');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognizer = null;
    if (SpeechRecognition) {
        recognizer = new SpeechRecognition();
        recognizer.lang = 'en-US';
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;
        recognizer.onresult = (e) => {
            const text = e.results[0][0].transcript;
            inputEl.value = text;
            inputEl.focus();
        };
        recognizer.onerror = () => { };
        micBtn?.addEventListener('click', () => {
            try { recognizer.start(); } catch { }
        });
    } else {
        micBtn?.setAttribute('disabled', 'true');
        micBtn?.setAttribute('title', 'Speech recognition not supported');
    }

    // Simple rule-based responses focused on mental health and general wellness
    function generateBotReply(conv) {
        const lastUser = [...conv.messages].reverse().find(m => m.role === 'user');
        const text = (lastUser?.text || '').toLowerCase();
        const rules = [
            { test: /hello|hi|hey/, reply: 'Hi there! I\'m MindMate. Would you like breathing, grounding, or sleep tips?' },
            { test: /anx|panic|worry|nervous|overwhelmed/, reply: 'Let\'s try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 4 times.' },
            { test: /stress|tense|pressure/, reply: 'Notice 5 things you see, 4 touch, 3 hear, 2 smell, 1 taste. It can ground you.' },
            { test: /sleep|insomnia|tired/, reply: 'Aim for a wind-down: lights dim, no screens 30 min, slow breaths. Want a quick routine?' },
            { test: /mood|sad|low|depress/, reply: 'I\'m here to listen. If symptoms persist, consider speaking to a professional you trust.' },
            { test: /focus|study|work|productivity/, reply: 'Try Pomodoro: 25 min focus + 5 min break. Want tips to get started?' },
            { test: /exercise|fitness|walk|yoga/, reply: 'Even 10 minutes of movement can lift mood. A short walk or stretches now?' },
            { test: /diet|food|eat|nutrition/, reply: 'Small, regular meals and hydration support energy and mood.' },
            { test: /help|support|talk|guidance/, reply: 'You\'re not alone. I can share coping techniques or help you structure a plan.' },
        ];
        for (const r of rules) if (r.test.test(text)) return r.reply;
        // If backend token exists, we already POST each user message to /api/chat
        return 'I can offer general wellbeing guidance, but this is not medical advice. If this feels urgent, please contact local emergency services.';
    }

    async function syncToBackend(message) {
        const token = localStorage.getItem('auth_access');
        if (!token) return;
        try {
            // naive: send message to an echo partner user id 1 (self) if real partner unknown
            await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receiver: 1, content: message.text })
            });
        } catch (e) {
            // ignore network errors for now
        }
    }

    /** Helpers **/
    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
})();


