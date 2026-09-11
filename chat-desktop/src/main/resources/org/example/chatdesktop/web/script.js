/* =========================================================
   ORBIT AI — AUTENTICAÇÃO, CHAT E HISTÓRICO
   ========================================================= */

/* ELEMENTOS PRINCIPAIS */

const authApp = document.getElementById("authApp");
const app = document.getElementById("app");

const loginPanel = document.getElementById("loginPanel");
const registerPanel = document.getElementById("registerPanel");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerPasswordConfirmation =
    document.getElementById("registerPasswordConfirmation");
const registerMessage = document.getElementById("registerMessage");
const registerSubmitBtn = document.getElementById("registerSubmitBtn");

const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const themeToggle = document.getElementById("themeToggle");
const authThemeToggle = document.getElementById("authThemeToggle");
const themeText = document.getElementById("themeText");
const themeIcon = document.getElementById("themeIcon");
const authThemeIcon = document.getElementById("authThemeIcon");

const sidebarNewChat = document.getElementById("sidebarNewChat");
const sidebarProfileBtn = document.getElementById("sidebarProfileBtn");
const logoBtn = document.getElementById("logoBtn");
const backHomeBtn = document.getElementById("backHomeBtn");

const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const chatTitle = document.getElementById("chatTitle");
const convCount = document.getElementById("convCount");

const messagesEl = document.getElementById("messages");
const chatAskBar = document.getElementById("chatAskBar");
const chatAskInput = document.getElementById("chatAskInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const homeAskBar = document.getElementById("homeAskBar");
const homeAskInput = document.getElementById("homeAskInput");

const stateLabel = document.getElementById("stateLabel");
const orbitAI = document.getElementById("orbitAI");

const shortcutsBtn = document.getElementById("shortcutsBtn");
const shortcutsModal = document.getElementById("shortcutsModal");
const closeShortcuts = document.getElementById("closeShortcuts");

const profileNameInput = document.getElementById("profileNameInput");
const profileAvatar = document.getElementById("profileAvatar");
const profileEmail = document.getElementById("profileEmail");
const profileGreeting = document.getElementById("profileGreeting");
const profileNameCounter = document.getElementById("profileNameCounter");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileMsgCount = document.getElementById("profileMsgCount");
const profileConvCount = document.getElementById("profileConvCount");

const homePasteBtn = document.getElementById("homePasteBtn");
const chatPasteBtn = document.getElementById("chatPasteBtn");

/* ESTADO */

let currentUser = null;
let currentView = "home";
let busy = false;
let conversations = [];
let conversationCounter = 0;
let totalMessages = 0;
let currentConversationId = null;
let conversationTitle = "";
let lastQuestion = null;
let confirmModal = null;

const EMPTY_CHAT_HTML = `
    <div id="emptyChat" class="empty-chat">
        <div class="mini-orbit">
            <div class="blob-wrap">
                <div class="blob"></div>
                <div class="blob b2"></div>
                <div class="blob core"></div>
            </div>
        </div>
        <p>Envie uma mensagem para começar a conversar com o Orbit.</p>
    </div>
`;

/* UTILITÁRIOS */

function parseJson(value, fallback = null) {
    try {
        return typeof value === "string"
            ? JSON.parse(value)
            : value;
    } catch (error) {
        console.error("JSON inválido:", error);
        return fallback;
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

function bridgeAvailable(method) {
    return window.orbitBridge &&
        typeof window.orbitBridge[method] === "function";
}

function waitForBridge(callback, attempts = 100) {
    if (window.orbitBridge) {
        callback();
        return;
    }

    if (attempts <= 0) {
        showAuthMessage(
            loginMessage,
            "Não foi possível conectar a interface ao Java.",
            "error"
        );
        return;
    }

    setTimeout(() => waitForBridge(callback, attempts - 1), 50);
}

function runBridge(method, ...argumentsList) {
    if (!bridgeAvailable(method)) {
        return false;
    }

    try {
        window.orbitBridge[method](...argumentsList);
        return true;
    } catch (error) {
        console.error(`Erro ao executar ${method}:`, error);
        return false;
    }
}

/* TEMA */

function applyTheme(theme) {
    const selectedTheme = theme === "light" ? "light" : "dark";
    const themeLink = document.getElementById("themeStyle");

    if (themeLink) {
        themeLink.href =
            `themes/${selectedTheme}.css?v=${Date.now()}`;
    }

    if (themeText) {
        themeText.textContent =
            selectedTheme === "dark"
                ? "Tema claro"
                : "Tema escuro";
    }

    const icon = selectedTheme === "dark" ? "☀" : "☾";

    if (themeIcon) themeIcon.textContent = icon;
    if (authThemeIcon) authThemeIcon.textContent = icon;

    try {
        localStorage.setItem("orbit-theme", selectedTheme);
    } catch (error) {
        console.error("Erro ao salvar tema:", error);
    }
}

function currentTheme() {
    try {
        return localStorage.getItem("orbit-theme") || "dark";
    } catch (error) {
        return "dark";
    }
}

function toggleTheme() {
    applyTheme(currentTheme() === "dark" ? "light" : "dark");
}

themeToggle?.addEventListener("click", toggleTheme);
authThemeToggle?.addEventListener("click", toggleTheme);

/* AUTENTICAÇÃO */

function showAuth() {
    currentUser = null;
    app.hidden = true;
    authApp.hidden = false;

    resetApplicationState();
    showAuthPanel("login");

    setTimeout(() => loginEmail?.focus(), 100);
}

function showApplication(user) {
    currentUser = user;
    authApp.hidden = true;
    app.hidden = false;

    loadProfile();
    showView("home");
}

function showAuthPanel(panel) {
    const registerActive = panel === "register";

    loginPanel.classList.toggle("active", !registerActive);
    registerPanel.classList.toggle("active", registerActive);

    clearAuthMessages();

    setTimeout(() => {
        if (registerActive) {
            registerName?.focus();
        } else {
            loginEmail?.focus();
        }
    }, 80);
}

function clearAuthMessages() {
    [
        loginMessage,
        registerMessage,
        document.getElementById("loginEmailError"),
        document.getElementById("loginPasswordError"),
        document.getElementById("registerNameError"),
        document.getElementById("registerEmailError"),
        document.getElementById("registerPasswordError"),
        document.getElementById(
            "registerPasswordConfirmationError"
        )
    ].forEach(element => {
        if (element) {
            element.textContent = "";
            element.className =
                element.classList.contains("auth-message")
                    ? "auth-message"
                    : "auth-field-error";
        }
    });

    document
        .querySelectorAll(".auth-input-wrap.invalid")
        .forEach(element => element.classList.remove("invalid"));
}

function showAuthMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message || "";
    element.className = `auth-message ${type}`;
}

function showFieldError(input, errorId, message) {
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
        errorElement.textContent = message || "";
    }

    input?.closest(".auth-input-wrap")
        ?.classList.toggle("invalid", Boolean(message));
}

function setAuthLoading(button, loading, text) {
    if (!button) return;

    button.disabled = loading;
    button.classList.toggle("loading", loading);

    const label = button.querySelector(".auth-submit-label");
    const arrow = button.querySelector(".auth-submit-arrow");

    if (label) {
        if (!button.dataset.originalLabel) {
            button.dataset.originalLabel = label.textContent.trim();
        }

        label.textContent = loading
            ? text
            : button.dataset.originalLabel;
    }

    if (arrow) {
        arrow.textContent = loading ? "•••" : "→";
    }
}

function validEmail(email) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
        .test(email);
}

function passwordRules(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

function updatePasswordRules() {
    const rules = passwordRules(registerPassword?.value || "");

    const mapping = {
        ruleLength: rules.length,
        ruleUppercase: rules.uppercase,
        ruleLowercase: rules.lowercase,
        ruleNumber: rules.number,
        ruleSpecial: rules.special
    };

    Object.entries(mapping).forEach(([id, valid]) => {
        const element = document.getElementById(id);

        if (!element) return;

        element.classList.toggle("valid", valid);

        const icon = element.querySelector("i");
        if (icon) icon.textContent = valid ? "✓" : "○";
    });
}

function validateLogin() {
    clearAuthMessages();

    let valid = true;
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email) {
        showFieldError(
            loginEmail,
            "loginEmailError",
            "Informe seu e-mail."
        );
        valid = false;
    } else if (!validEmail(email)) {
        showFieldError(
            loginEmail,
            "loginEmailError",
            "Informe um e-mail válido."
        );
        valid = false;
    }

    if (!password) {
        showFieldError(
            loginPassword,
            "loginPasswordError",
            "Informe sua senha."
        );
        valid = false;
    }

    return valid;
}

function validateRegistration() {
    clearAuthMessages();

    let valid = true;
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirmation = registerPasswordConfirmation.value;
    const rules = passwordRules(password);

    if (name.length < 2) {
        showFieldError(
            registerName,
            "registerNameError",
            "Informe um nome com pelo menos 2 caracteres."
        );
        valid = false;
    }

    if (!validEmail(email)) {
        showFieldError(
            registerEmail,
            "registerEmailError",
            "Informe um e-mail válido."
        );
        valid = false;
    }

    if (!Object.values(rules).every(Boolean)) {
        showFieldError(
            registerPassword,
            "registerPasswordError",
            "A senha ainda não atende a todos os requisitos."
        );
        valid = false;
    }

    if (!confirmation) {
        showFieldError(
            registerPasswordConfirmation,
            "registerPasswordConfirmationError",
            "Confirme sua senha."
        );
        valid = false;
    } else if (password !== confirmation) {
        showFieldError(
            registerPasswordConfirmation,
            "registerPasswordConfirmationError",
            "As senhas não coincidem."
        );
        valid = false;
    }

    return valid;
}

loginForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateLogin()) return;

    setAuthLoading(loginSubmitBtn, true, "Entrando...");
    showAuthMessage(loginMessage, "", "");

    if (!runBridge(
        "login",
        loginEmail.value.trim(),
        loginPassword.value
    )) {
        setAuthLoading(loginSubmitBtn, false);
        showAuthMessage(
            loginMessage,
            "Não foi possível acessar o serviço de autenticação."
        );
    }
});

registerForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateRegistration()) return;

    setAuthLoading(registerSubmitBtn, true, "Criando conta...");
    showAuthMessage(registerMessage, "", "");

    if (!runBridge(
        "register",
        registerName.value.trim(),
        registerEmail.value.trim(),
        registerPassword.value,
        registerPasswordConfirmation.value
    )) {
        setAuthLoading(registerSubmitBtn, false);
        showAuthMessage(
            registerMessage,
            "Não foi possível acessar o serviço de autenticação."
        );
    }
});

showRegisterBtn?.addEventListener(
    "click",
    () => showAuthPanel("register")
);

showLoginBtn?.addEventListener(
    "click",
    () => showAuthPanel("login")
);

registerPassword?.addEventListener(
    "input",
    updatePasswordRules
);

document
    .querySelectorAll(".password-toggle")
    .forEach(button => {
        button.addEventListener("click", () => {
            const input = document.getElementById(
                button.dataset.passwordTarget
            );

            if (!input) return;

            input.type =
                input.type === "password" ? "text" : "password";

            button.textContent =
                input.type === "password" ? "◉" : "◌";
        });
    });

logoutBtn?.addEventListener("click", () => {
    showConfirm(
        "Sair da conta?",
        "Você poderá entrar novamente usando seu e-mail e senha.",
        confirmed => {
            if (confirmed) {
                runBridge("logout");
            }
        }
    );
});

/* RESPOSTAS DE AUTENTICAÇÃO ENVIADAS PELO JAVA */

window.orbitAuthResult = function (jsonResult) {
    const result = parseJson(jsonResult);

    if (!result) return;

    const isRegistration = result.action === "register";
    const button = isRegistration
        ? registerSubmitBtn
        : loginSubmitBtn;
    const messageElement = isRegistration
        ? registerMessage
        : loginMessage;

    setAuthLoading(button, false);

    if (!result.success) {
        showAuthMessage(
            messageElement,
            result.message || "Não foi possível entrar."
        );
        return;
    }

    showAuthMessage(
        messageElement,
        result.message || "Autenticação concluída.",
        "success"
    );

    currentUser = result.user;

    setTimeout(() => {
        if (isRegistration) {
            registerForm.reset();
            updatePasswordRules();
        } else {
            loginPassword.value = "";
        }

        showApplication(currentUser);
    }, 300);
};

window.orbitSession = function (jsonSession) {
    const session = parseJson(jsonSession, {authenticated: false});

    if (session.authenticated && session.user) {
        showApplication(session.user);
        runBridge("dbLoadHistory");
    } else {
        showAuth();
    }
};

window.orbitLoggedOut = function () {
    loginForm?.reset();
    registerForm?.reset();
    updatePasswordRules();
    showAuth();
};

/* NAVEGAÇÃO */

function showView(name) {
    document.querySelectorAll(".view").forEach(view => {
        view.classList.remove("active");
    });

    const target = document.getElementById(`view-${name}`);

    if (!target) return;

    target.classList.add("active");
    currentView = name;

    if (name === "chat") {
        setTimeout(() => chatAskInput?.focus(), 100);
    }
}

logoBtn?.addEventListener("click", () => showView("home"));
backHomeBtn?.addEventListener("click", () => showView("home"));

/* ESTADO DO ORBE */

function setState(state) {
    orbitAI?.classList.remove(
        "idle",
        "listening",
        "thinking",
        "responding"
    );

    orbitAI?.classList.add(state);

    const labels = {
        idle: "online",
        listening: "digitando...",
        thinking: "pensando...",
        responding: "respondendo..."
    };

    if (stateLabel) {
        stateLabel.textContent = labels[state] || "online";
    }
}

/* ERROS */

function friendlyError(message) {
    if (!navigator.onLine) {
        return "Sem conexão com a internet. Verifique sua rede.";
    }

    const text = String(message || "").toLowerCase();

    if (text.includes("sessão")) {
        return "Sua sessão não está ativa. Entre novamente.";
    }

    if (
        text.includes("inválida") ||
        text.includes("expirou") ||
        text.includes("api")
    ) {
        return "A chave da Groq é inválida ou não foi configurada.";
    }

    if (text.includes("limite")) {
        return "O limite da IA foi atingido. Tente novamente depois.";
    }

    if (
        text.includes("servidor") ||
        text.includes("indisponível")
    ) {
        return "O servidor da IA está indisponível no momento.";
    }

    return message || "Ocorreu um erro inesperado.";
}

window.orbitError = function (jsonError) {
    removeTyping();

    const parsed = parseJson(jsonError);
    const message = parsed
        ? parsed.errorMessage || parsed.content
        : jsonError;

    addMessage(
        "assistant",
        friendlyError(message),
        "error",
        true,
        [],
        false
    );

    busy = false;
    if (chatSendBtn) chatSendBtn.disabled = false;
    setState("idle");
};

/* MENSAGENS */

function addMessage(
    role,
    text,
    origin = "unknown",
    isError = false,
    sources = [],
    persist = true
) {
    document.getElementById("emptyChat")?.remove();

    const row = document.createElement("div");
    row.className = `msg ${role === "user" ? "user" : "orbit"}`;

    const bubble = document.createElement("div");
    bubble.className =
        `bubble${isError ? " error-bubble" : ""}`;

    const messageText = document.createElement("div");
    messageText.className = "message-text";
    messageText.innerHTML = escapeHtml(text).replace(/\n/g, "<br>");
    bubble.appendChild(messageText);

    if (role === "assistant" && !isError) {
        const metadata = document.createElement("div");
        metadata.className = "message-metadata";

        const badge = document.createElement("span");
        badge.className = `origin-badge origin-${origin}`;

        const labels = {
            rag: "📚 Base de Conhecimento",
            fallback: "🌐 Resposta Geral",
            internet: "🔗 Internet"
        };

        badge.textContent = labels[origin] || "Orbit AI";
        metadata.appendChild(badge);

        if (sources?.length) {
            const sourceBadge = document.createElement("span");
            sourceBadge.className = "sources-badge";
            sourceBadge.textContent = `📄 ${sources.join(", ")}`;
            metadata.appendChild(sourceBadge);
        }

        bubble.appendChild(metadata);
    }

    const actions = document.createElement("div");
    actions.className = "message-actions";

    if (!isError) {
        const copyButton = document.createElement("button");
        copyButton.className = "copy-btn";
        copyButton.type = "button";
        copyButton.textContent = "📋 Copiar";

        copyButton.addEventListener("click", () => {
            const success = runBridge("copyToClipboard", text);

            copyButton.textContent =
                success ? "✓ Copiado!" : "Erro";

            setTimeout(() => {
                copyButton.textContent = "📋 Copiar";
            }, 1500);
        });

        actions.appendChild(copyButton);
    }

    if (role === "assistant" && !isError) {
        const regenerateButton = document.createElement("button");
        regenerateButton.className = "regenerate-btn";
        regenerateButton.type = "button";
        regenerateButton.textContent = "🔄 Regenerar";
        regenerateButton.addEventListener(
            "click",
            regenerateResponse
        );
        actions.appendChild(regenerateButton);
    }

    bubble.appendChild(actions);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const conversation = findConversation(currentConversationId);

    if (conversation && persist) {
        conversation.messages.push({
            role,
            text,
            origin,
            sources: sources || [],
            isError: Boolean(isError)
        });

        runBridge(
            "dbSaveMessage",
            conversation.id,
            role,
            text,
            origin,
            JSON.stringify(sources || []),
            Boolean(isError)
        );
    }
}

function showTyping() {
    removeTyping();

    const row = document.createElement("div");
    row.id = "typingIndicator";
    row.className = "msg orbit";
    row.innerHTML = `
        <div class="bubble typing-dots">
            <span></span><span></span><span></span>
        </div>
    `;

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
    document.getElementById("typingIndicator")?.remove();
}

window.orbitReceive = function (jsonResponse) {
    removeTyping();

    const response = parseJson(jsonResponse);

    if (!response) {
        addMessage("assistant", jsonResponse, "fallback");
    } else if (response.success !== false) {
        addMessage(
            "assistant",
            response.content || "",
            response.origin || "unknown",
            false,
            response.sources || []
        );

        totalMessages++;
        updateProfileStats();
    }

    busy = false;
    if (chatSendBtn) chatSendBtn.disabled = false;
    setState("idle");
    chatAskInput?.focus();
};

/* HISTÓRICO */

window.orbitLoadHistory = function (jsonHistory) {
    const history = parseJson(jsonHistory, []);

    conversations = Array.isArray(history)
        ? history.map(conversation => ({
            id: Number(conversation.id),
            title: conversation.title,
            messages: (conversation.messages || []).map(message => ({
                role: message.role,
                text: message.text,
                origin: message.origin || "unknown",
                sources: message.sources || [],
                isError: Boolean(message.isError)
            }))
        }))
        : [];

    conversationCounter = conversations.reduce(
        (maximum, conversation) =>
            Math.max(maximum, conversation.id),
        0
    );

    totalMessages = conversations.reduce(
        (total, conversation) =>
            total + conversation.messages.length,
        0
    );

    renderHistory();
    updateProfileStats();
};

function findConversation(id) {
    return conversations.find(
        conversation => conversation.id === id
    );
}

function createConversation(firstMessage) {
    if (currentConversationId !== null) return;

    conversationTitle =
        firstMessage.length <= 32
            ? firstMessage
            : `${firstMessage.substring(0, 32)}…`;

    conversationCounter = Math.max(
        Date.now(),
        conversationCounter + 1
    );

    currentConversationId = conversationCounter;

    conversations.unshift({
        id: currentConversationId,
        title: conversationTitle,
        messages: []
    });

    chatTitle.textContent =
        conversationTitle.toUpperCase();

    renderHistory();
    updateProfileStats();

    runBridge(
        "dbCreateConversation",
        currentConversationId,
        conversationTitle
    );
}

function renderHistory() {
    historyList.innerHTML = "";

    if (!conversations.length) {
        historyList.appendChild(historyEmpty);
        return;
    }

    conversations.forEach(conversation => {
        const container = document.createElement("div");
        container.className = "history-item-container";

        const button = document.createElement("button");
        button.className =
            `history-item${
                conversation.id === currentConversationId
                    ? " active"
                    : ""
            }`;
        button.type = "button";
        button.textContent = conversation.title;
        button.addEventListener(
            "click",
            () => openConversation(conversation.id)
        );

        const actions = document.createElement("div");
        actions.className = "history-item-actions";

        const renameButton = document.createElement("button");
        renameButton.className = "history-action-btn";
        renameButton.type = "button";
        renameButton.title = "Renomear";
        renameButton.textContent = "✎";
        renameButton.addEventListener("click", event => {
            event.stopPropagation();
            renameConversation(conversation.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className =
            "history-action-btn delete-btn";
        deleteButton.type = "button";
        deleteButton.title = "Excluir";
        deleteButton.textContent = "🗑";
        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            deleteConversation(conversation.id);
        });

        actions.append(renameButton, deleteButton);
        container.append(button, actions);
        historyList.appendChild(container);
    });
}

function renderMessages(messageList) {
    messagesEl.innerHTML = "";

    if (!messageList?.length) {
        messagesEl.innerHTML = EMPTY_CHAT_HTML;
        return;
    }

    messageList.forEach(message => {
        addMessage(
            message.role,
            message.text,
            message.origin,
            message.isError,
            message.sources,
            false
        );
    });
}

function openConversation(id) {
    if (busy) return;

    const conversation = findConversation(id);
    if (!conversation) return;

    currentConversationId = conversation.id;
    conversationTitle = conversation.title;
    chatTitle.textContent = conversation.title.toUpperCase();

    renderMessages(conversation.messages);
    renderHistory();
    showView("chat");
}

function startNewChat() {
    if (busy || !currentUser) return;

    currentConversationId = null;
    conversationTitle = "";
    chatTitle.textContent = "NOVA CONVERSA";
    messagesEl.innerHTML = EMPTY_CHAT_HTML;
    chatAskInput.value = "";

    renderHistory();
    showView("chat");
}

function renameConversation(id) {
    const conversation = findConversation(id);
    if (!conversation) return;

    const newTitle = window.prompt(
        "Digite o novo nome da conversa:",
        conversation.title
    );

    if (!newTitle?.trim()) return;

    conversation.title = newTitle.trim().substring(0, 60);

    if (id === currentConversationId) {
        chatTitle.textContent =
            conversation.title.toUpperCase();
    }

    renderHistory();

    runBridge(
        "dbRenameConversation",
        id,
        conversation.title
    );
}

function deleteConversation(id) {
    const conversation = findConversation(id);
    if (!conversation) return;

    showConfirm(
        "Excluir conversa?",
        `A conversa "${conversation.title}" será excluída.`,
        confirmed => {
            if (!confirmed) return;

            conversations = conversations.filter(
                item => item.id !== id
            );

            if (currentConversationId === id) {
                currentConversationId = null;
                conversationTitle = "";
                messagesEl.innerHTML = EMPTY_CHAT_HTML;
                chatTitle.textContent = "NOVA CONVERSA";
                showView("home");
            }

            renderHistory();
            updateProfileStats();
            runBridge("dbDeleteConversation", id);
        }
    );
}

sidebarNewChat?.addEventListener("click", startNewChat);

/* ENVIO PARA IA */

function sendMessage(value) {
    const text = value.trim();

    if (!text || busy || !currentUser) return;

    if (!navigator.onLine) {
        addMessage(
            "assistant",
            friendlyError(),
            "error",
            true,
            [],
            false
        );
        return;
    }

    busy = true;
    if (chatSendBtn) chatSendBtn.disabled = true;

    createConversation(text);
    addMessage("user", text, "user");

    totalMessages++;
    updateProfileStats();

    lastQuestion = text;

    showView("chat");
    setState("thinking");
    showTyping();

    if (!runBridge("ask", text)) {
        window.orbitError(
            JSON.stringify({
                errorMessage:
                    "Erro ao comunicar com o Java."
            })
        );
    }
}

function regenerateResponse() {
    if (busy || !lastQuestion) return;

    const conversation =
        findConversation(currentConversationId);

    if (!conversation?.messages.length) return;

    const finalMessage =
        conversation.messages[
        conversation.messages.length - 1
            ];

    if (finalMessage.role !== "assistant") return;

    conversation.messages.pop();
    runBridge(
        "dbRemoveLastMessage",
        currentConversationId
    );

    renderMessages(conversation.messages);

    busy = true;
    if (chatSendBtn) chatSendBtn.disabled = true;

    setState("thinking");
    showTyping();

    runBridge("ask", lastQuestion);
}

homeAskBar?.addEventListener("submit", event => {
    event.preventDefault();

    const value = homeAskInput.value;
    homeAskInput.value = "";
    sendMessage(value);
});

chatAskBar?.addEventListener("submit", event => {
    event.preventDefault();

    const value = chatAskInput.value;
    chatAskInput.value = "";
    sendMessage(value);
});

document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
        sendMessage(pill.dataset.q || "");
    });
});

/* PERFIL */

function profileStorageKey() {
    return currentUser
        ? `orbit-profile-name-${currentUser.id}`
        : "orbit-profile-name";
}

function updateProfileNameUI(name) {
    const normalized = String(name || "")
        .trim()
        .replace(/\s+/g, " ");

    if (profileAvatar) {
        profileAvatar.textContent =
            normalized
                ? normalized.charAt(0).toUpperCase()
                : "O";
    }

    if (profileNameCounter) {
        profileNameCounter.textContent =
            `${normalized.length}/24`;
    }

    if (profileGreeting) {
        profileGreeting.textContent =
            normalized
                ? `Que bom ter você por aqui, ${normalized}.`
                : "Personalize como o Orbit deve chamar você.";
    }
}

function loadProfile() {
    if (!currentUser) return;

    let name = currentUser.name || "";

    try {
        name =
            localStorage.getItem(profileStorageKey()) ||
            name;
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }

    profileNameInput.value = name.substring(0, 24);
    profileEmail.textContent = currentUser.email || "—";

    updateProfileNameUI(profileNameInput.value);
    updateProfileStats();
}

function saveProfile() {
    const name = profileNameInput.value
        .trim()
        .replace(/\s+/g, " ")
        .substring(0, 24);

    profileNameInput.value = name;

    try {
        localStorage.setItem(profileStorageKey(), name);
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
        return;
    }

    updateProfileNameUI(name);

    const label =
        saveProfileBtn.querySelector("span:first-child");
    const arrow =
        saveProfileBtn.querySelector(".profile-save-arrow");

    label.textContent = "Alterações salvas";
    arrow.textContent = "✓";
    saveProfileBtn.disabled = true;

    setTimeout(() => {
        label.textContent = "Salvar alterações";
        arrow.textContent = "→";
        saveProfileBtn.disabled = false;
    }, 1500);
}

function updateProfileStats() {
    if (convCount) convCount.textContent = totalMessages;
    if (profileMsgCount) {
        profileMsgCount.textContent = totalMessages;
    }
    if (profileConvCount) {
        profileConvCount.textContent = conversations.length;
    }
}

profileNameInput?.addEventListener(
    "input",
    () => updateProfileNameUI(profileNameInput.value)
);

profileNameInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        saveProfile();
    }
});

saveProfileBtn?.addEventListener("click", saveProfile);

sidebarProfileBtn?.addEventListener("click", () => {
    loadProfile();
    showView("profile");
});

/* CLIPBOARD */

async function pasteInto(input) {
    if (!input) return;

    try {
        let text = "";

        if (bridgeAvailable("pasteFromClipboard")) {
            text = window.orbitBridge.pasteFromClipboard();
        } else if (navigator.clipboard?.readText) {
            text = await navigator.clipboard.readText();
        }

        if (text) input.value = text;
        input.focus();
    } catch (error) {
        console.error("Erro ao colar:", error);
    }
}

homePasteBtn?.addEventListener(
    "click",
    () => pasteInto(homeAskInput)
);

chatPasteBtn?.addEventListener(
    "click",
    () => pasteInto(chatAskInput)
);

/* MODAIS */

function showConfirm(title, message, callback) {
    if (!confirmModal) {
        confirmModal = document.createElement("div");
        confirmModal.className =
            "modal-overlay confirmation-modal";

        confirmModal.innerHTML = `
            <div class="modal-box confirmation-box">
                <div class="modal-header">
                    <h3 id="confirmTitle"></h3>
                    <button id="confirmClose"
                            class="modal-close"
                            type="button">✕</button>
                </div>
                <p id="confirmMessage"></p>
                <div class="confirmation-buttons">
                    <button id="confirmYes"
                            class="btn-confirm-yes"
                            type="button">Confirmar</button>
                    <button id="confirmNo"
                            class="btn-confirm-no"
                            type="button">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);
    }

    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;

    confirmModal.classList.add("open");

    const finish = result => {
        confirmModal.classList.remove("open");
        callback(result);
    };

    document.getElementById("confirmYes").onclick =
        () => finish(true);
    document.getElementById("confirmNo").onclick =
        () => finish(false);
    document.getElementById("confirmClose").onclick =
        () => finish(false);
}

function toggleShortcuts(open) {
    shortcutsModal?.classList.toggle(
        "open",
        open ?? !shortcutsModal.classList.contains("open")
    );
}

shortcutsBtn?.addEventListener(
    "click",
    () => toggleShortcuts(true)
);

closeShortcuts?.addEventListener(
    "click",
    () => toggleShortcuts(false)
);

shortcutsModal?.addEventListener("click", event => {
    if (event.target === shortcutsModal) {
        toggleShortcuts(false);
    }
});

/* FUNÇÕES UTILIZADAS PELO MAIN.JAVA */

window.orbitNewChat = startNewChat;

window.orbitClearInput = function () {
    const input =
        currentView === "chat"
            ? chatAskInput
            : homeAskInput;

    if (input) {
        input.value = "";
        input.focus();
    }
};

window.orbitSubmit = function () {
    if (!currentUser) return;

    if (currentView === "chat") {
        chatAskBar?.requestSubmit();
    } else {
        homeAskBar?.requestSubmit();
    }
};

/* ATALHOS */

window.addEventListener("keydown", event => {
    if (!currentUser) return;

    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        (
            document.activeElement === chatAskInput ||
            document.activeElement === homeAskInput
        )
    ) {
        event.preventDefault();
        window.orbitSubmit();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        startNewChat();
    }

    if (event.ctrlKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        window.orbitClearInput();
    }

    if (event.ctrlKey && event.key === "/") {
        event.preventDefault();
        toggleShortcuts();
    }
});

/* LIMPEZA DE ESTADO */

function resetApplicationState() {
    busy = false;
    conversations = [];
    conversationCounter = 0;
    totalMessages = 0;
    currentConversationId = null;
    conversationTitle = "";
    lastQuestion = null;

    if (historyList) historyList.innerHTML = "";
    if (historyList && historyEmpty) {
        historyList.appendChild(historyEmpty);
    }

    if (messagesEl) messagesEl.innerHTML = EMPTY_CHAT_HTML;
    if (chatTitle) chatTitle.textContent = "NOVA CONVERSA";

    updateProfileStats();
    setState("idle");
}

/* INICIALIZAÇÃO */

document.addEventListener("DOMContentLoaded", () => {
    applyTheme(currentTheme());
    updatePasswordRules();
    resetApplicationState();

    waitForBridge(() => {
        runBridge("checkSession");
    });
});