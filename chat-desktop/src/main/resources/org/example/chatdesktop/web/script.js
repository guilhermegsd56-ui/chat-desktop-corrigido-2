/* =========================================================
   ORBIT AI v2.0
   SCRIPT PRINCIPAL — COM PERSISTÊNCIA SQLite
   ========================================================= */


/* =========================================================
   REFERÊNCIAS
   ========================================================= */

const themeStyle =
    document.getElementById("themeStyle");

const themeToggle =
    document.getElementById("themeToggle");

const themeText =
    document.getElementById("themeText");

const themeIcon =
    document.getElementById("themeIcon");


const sidebarNewChat =
    document.getElementById("sidebarNewChat");

const sidebarProfileBtn =
    document.getElementById("sidebarProfileBtn");

const logoBtn =
    document.getElementById("logoBtn");

const backHomeBtn =
    document.getElementById("backHomeBtn");


const historyList =
    document.getElementById("historyList");

const historyEmpty =
    document.getElementById("historyEmpty");

const chatTitle =
    document.getElementById("chatTitle");

const convCount =
    document.getElementById("convCount");


const messagesEl =
    document.getElementById("messages");

const emptyChat =
    document.getElementById("emptyChat");


const chatAskBar =
    document.getElementById("chatAskBar");

const chatAskInput =
    document.getElementById("chatAskInput");

const chatSendBtn =
    document.getElementById("chatSendBtn");


const homeAskBar =
    document.getElementById("homeAskBar");

const homeAskInput =
    document.getElementById("homeAskInput");


const stateLabel =
    document.getElementById("stateLabel");

const orbitAI =
    document.getElementById("orbitAI");


/* =========================================================
   ATALHOS
   ========================================================= */

const shortcutsBtn =
    document.getElementById("shortcutsBtn");

const shortcutsModal =
    document.getElementById("shortcutsModal");

const closeShortcuts =
    document.getElementById("closeShortcuts");


/* =========================================================
   PERFIL
   ========================================================= */

const profileNameInput =
    document.getElementById("profileNameInput");

const profileAvatar =
    document.getElementById("profileAvatar");

const saveProfileBtn =
    document.getElementById("saveProfileBtn");

const profileMsgCount =
    document.getElementById("profileMsgCount");

const profileConvCount =
    document.getElementById("profileConvCount");


/* =========================================================
   CLIPBOARD
   ========================================================= */

const homePasteBtn =
    document.getElementById("homePasteBtn");

const chatPasteBtn =
    document.getElementById("chatPasteBtn");


/* =========================================================
   MODAL DE CONFIRMAÇÃO
   ========================================================= */

let confirmModal = null;
let confirmCallback = null;


function createConfirmModal() {

    const modal = document.createElement("div");
    modal.id = "confirmationModal";
    modal.className = "modal-overlay confirmation-modal";
    modal.style.display = "none";

    modal.innerHTML = `
        <div class="modal-box confirmation-box">
            <div class="modal-header">
                <h3 id="confirmTitle">Confirmar ação</h3>
                <button class="modal-close" id="confirmClose" type="button">✕</button>
            </div>
            <p id="confirmMessage">Tem certeza que deseja fazer isso?</p>
            <div class="confirmation-buttons">
                <button id="confirmYes" class="btn-confirm-yes" type="button">Sim, confirmar</button>
                <button id="confirmNo" class="btn-confirm-no" type="button">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("confirmClose").addEventListener("click", () => closeConfirm());

    document.getElementById("confirmYes").addEventListener("click", () => {

        if (confirmCallback) {
            confirmCallback(true);
        }

        closeConfirm();
    });

    document.getElementById("confirmNo").addEventListener("click", () => {

        if (confirmCallback) {
            confirmCallback(false);
        }

        closeConfirm();
    });

    return modal;
}


function showConfirm(title, message, callback) {

    if (!confirmModal) {
        confirmModal = createConfirmModal();
    }

    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;

    confirmCallback = callback;

    confirmModal.style.display = "flex";
}


function closeConfirm() {

    if (confirmModal) {
        confirmModal.style.display = "none";
    }

    confirmCallback = null;
}


/* =========================================================
   MODAL DE RENOMEAR
   ========================================================= */

let renameModal = null;
let renameCallback = null;


function createRenameModal() {

    const modal = document.createElement("div");
    modal.id = "renameModal";
    modal.className = "modal-overlay confirmation-modal";
    modal.style.display = "none";

    modal.innerHTML = `
        <div class="modal-box confirmation-box">
            <div class="modal-header">
                <h3>Renomear conversa</h3>
                <button class="modal-close" id="renameClose" type="button">✕</button>
            </div>
            <input
                type="text"
                id="renameInput"
                class="rename-input"
                maxlength="60"
                placeholder="Digite o novo título" />
            <div class="confirmation-buttons">
                <button id="renameSave" class="btn-confirm-yes" type="button">Salvar</button>
                <button id="renameCancel" class="btn-confirm-no" type="button">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const input = document.getElementById("renameInput");

    const finalizar = (valor) => {

        if (renameCallback) {
            renameCallback(valor);
        }

        renameModal.style.display = "none";
        renameCallback = null;
    };

    document.getElementById("renameClose")
        .addEventListener("click", () => finalizar(null));

    document.getElementById("renameCancel")
        .addEventListener("click", () => finalizar(null));

    document.getElementById("renameSave")
        .addEventListener("click", () => finalizar(input.value.trim()));

    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter") {
            event.preventDefault();
            finalizar(input.value.trim());
        }

        if (event.key === "Escape") {
            event.preventDefault();
            finalizar(null);
        }
    });

    return modal;
}


function showRename(valorAtual, callback) {

    if (!renameModal) {
        renameModal = createRenameModal();
    }

    const input = document.getElementById("renameInput");
    input.value = valorAtual || "";

    renameCallback = callback;

    renameModal.style.display = "flex";

    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
}


/* =========================================================
   ESTADO DO APLICATIVO
   ========================================================= */

let currentView = "home";

let busy = false;

let conversationTitle = "";

let conversations = [];

let conversationCounter = 0;

let totalMessages = 0;

let currentConversationId = null;

let lastQuestion = null;
let lastQuestionConversationId = null;

let copyTimeout = null;


/* =========================================================
   CHAT VAZIO
   ========================================================= */

const EMPTY_CHAT_HTML = `

<div
    id="emptyChat"
    class="empty-chat">

    <div class="mini-orbit">

        <div class="blob-wrap">

            <div class="blob"></div>

            <div class="blob b2"></div>

            <div class="blob core"></div>

        </div>

    </div>

    <p>
        Envie uma mensagem para começar
        a conversar com o Orbit.
    </p>

</div>

`;


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showView(name) {

    document
        .querySelectorAll(".view")
        .forEach(view => {

            view.classList.remove("active");

        });


    const target =
        document.getElementById(
            "view-" + name
        );


    if (target) {

        target.classList.add("active");

        currentView = name;


        if (
            name === "chat" &&
            chatAskInput
        ) {

            setTimeout(() => {

                chatAskInput.focus();

            }, 150);

        }

    }

}


if (logoBtn) {

    logoBtn.addEventListener(
        "click",
        () => showView("home")
    );

}


if (backHomeBtn) {

    backHomeBtn.addEventListener(
        "click",
        () => showView("home")
    );

}


/* =========================================================
   ESTADO DO ORBE
   ========================================================= */

function setState(state) {

    if (orbitAI) {

        orbitAI.classList.remove(
            "idle",
            "listening",
            "thinking",
            "responding"
        );


        orbitAI.classList.add(state);

    }


    const labels = {

        idle: "online",

        listening: "digitando...",

        thinking: "pensando...",

        responding: "respondendo..."

    };


    if (stateLabel) {

        stateLabel.textContent =
            labels[state] || "online";

    }

}


/* =========================================================
   TEMA
   ========================================================= */

function applyTheme(theme) {

    theme =
        theme === "light"
            ? "light"
            : "dark";


    const novoLink =
        document.createElement("link");


    novoLink.rel =
        "stylesheet";


    novoLink.id =
        "themeStyle";


    novoLink.href =
        "themes/" +
        theme +
        ".css?v=" +
        Date.now();


    novoLink.onload = () => {

        const antigo =
            document.getElementById(
                "themeStyle"
            );


        if (
            antigo &&
            antigo !== novoLink
        ) {

            antigo.remove();

        }

    };


    document.head.appendChild(
        novoLink
    );


    if (themeText) {

        themeText.textContent =
            theme === "dark"
                ? "Tema claro"
                : "Tema escuro";

    }


    if (themeIcon) {

        themeIcon.textContent =
            theme === "dark"
                ? "☀"
                : "☾";

    }


    try {

        localStorage.setItem(
            "orbit-theme",
            theme
        );

    } catch (e) {

        console.error(
            "Erro ao salvar tema:",
            e
        );

    }

}


function initTheme() {

    let saved = "dark";


    try {

        saved =
            localStorage.getItem(
                "orbit-theme"
            ) || "dark";

    } catch (e) {

        console.error(
            "Erro ao carregar tema:",
            e
        );

    }


    applyTheme(saved);

}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        () => {

            let atual = "dark";


            try {

                atual =
                    localStorage.getItem(
                        "orbit-theme"
                    ) || "dark";

            } catch (e) {}


            applyTheme(
                atual === "dark"
                    ? "light"
                    : "dark"
            );

        }
    );

}


/* =========================================================
   TRATAMENTO DE ERROS
   ========================================================= */

function friendlyError(msg) {

    if (!navigator.onLine) {

        return (
            "Sem conexão com a internet. " +
            "Verifique sua rede e tente novamente."
        );

    }


    if (!msg) {

        return (
            "Ocorreu um erro inesperado. " +
            "Tente novamente."
        );

    }


    const m =
        msg.toLowerCase();


    if (
        m.includes("inválida") ||
        m.includes("expirou")
    ) {

        return (
            "Chave de API inválida ou expirada. " +
            "Verifique a configuração."
        );

    }


    if (m.includes("limite")) {

        return (
            "Limite de uso da API atingido. " +
            "Aguarde um instante e tente novamente."
        );

    }


    if (
        m.includes("indisponível") ||
        m.includes("servidor")
    ) {

        return (
            "O servidor da IA está indisponível " +
            "no momento. Tente novamente em instantes."
        );

    }


    return msg;

}


/* =========================================================
   ERRO EXTERNO
   ========================================================= */

window.orbitError =
    function (jsonOrError) {

        removeTyping();

        let errorMessage = "Erro desconhecido";


        try {

            const parsed = JSON.parse(jsonOrError);

            errorMessage =
                parsed.errorMessage ||
                friendlyError(parsed.content || "");

        } catch (e) {

            errorMessage =
                friendlyError(jsonOrError);

        }


        addMessage(
            "assistant",
            errorMessage,
            "error",
            true,
            []
        );


        busy = false;


        if (chatSendBtn) {

            chatSendBtn.disabled =
                false;

        }


        setState("idle");

    };


/* =========================================================
   MENSAGENS (COM ORIGEM, FONTES E PERSISTÊNCIA NO BANCO)
   ========================================================= */

function addMessage(
    role,
    text,
    origin = "unknown",
    isError = false,
    sources = []
) {

    const emptyNode =
        document.getElementById(
            "emptyChat"
        );


    if (
        emptyNode &&
        emptyNode.parentNode === messagesEl
    ) {

        emptyNode.remove();

    }


    const row =
        document.createElement("div");


    row.className =
        "msg " +
        (
            role === "user"
                ? "user"
                : "orbit"
        );


    const bubble =
        document.createElement("div");


    bubble.className =
        "bubble" +
        (
            isError
                ? " error-bubble"
                : ""
        );


    bubble.innerHTML =
        `<div class="message-text">${escapeHtml(text)}</div>`;


    if (role === "assistant" && !isError) {

        const metadataDiv =
            document.createElement("div");

        metadataDiv.className =
            "message-metadata";


        const originBadge =
            document.createElement("span");

        originBadge.className =
            `origin-badge origin-${origin}`;


        const originLabels = {

            "rag":
                "📚 Base de Conhecimento (RAG)",

            "fallback":
                "🌐 Resposta Geral",

            "internet":
                "🔗 Internet",

            "error":
                "❌ Erro"

        };


        originBadge.textContent =
            originLabels[origin] ||
            "❓ Desconhecido";


        metadataDiv.appendChild(
            originBadge
        );


        if (sources && sources.length > 0) {

            const sourcesSpan =
                document.createElement("span");

            sourcesSpan.className =
                "sources-badge";

            sourcesSpan.textContent =
                `📄 Fontes: ${sources.join(", ")}`;

            metadataDiv.appendChild(
                sourcesSpan
            );

        }


        bubble.appendChild(
            metadataDiv
        );

    }


    const buttonsDiv =
        document.createElement("div");

    buttonsDiv.className =
        "message-actions";


    if (!isError) {

        const copyBtn =
            document.createElement("button");


        copyBtn.className =
            "copy-btn";


        copyBtn.textContent =
            "📋 Copiar";


        copyBtn.type =
            "button";


        copyBtn.onclick = (event) => {

            event.stopPropagation();
            event.preventDefault();


            if (copyTimeout) {

                return;

            }


            copyTimeout =
                setTimeout(() => {

                    copyTimeout = null;

                }, 1000);


            const showResult = (ok) => {

                copyBtn.textContent =
                    ok ? "✓ Copiado!" : "❌ Erro";

                setTimeout(() => {

                    copyBtn.textContent =
                        "📋 Copiar";

                }, 1800);

            };


            const copyWithExecCommand = () => {

                try {

                    const textarea =
                        document.createElement("textarea");

                    textarea.value = text;
                    textarea.style.position = "fixed";
                    textarea.style.opacity = "0";
                    textarea.style.top = "0";
                    textarea.style.left = "0";

                    document.body.appendChild(textarea);
                    textarea.focus();
                    textarea.select();

                    const sucesso =
                        document.execCommand("copy");

                    document.body.removeChild(textarea);

                    return sucesso;

                } catch (e) {

                    console.error(
                        "Erro no execCommand:",
                        e
                    );

                    return false;

                }

            };


            if (
                window.orbitBridge &&
                typeof window.orbitBridge.copyToClipboard === "function"
            ) {

                try {

                    const ok =
                        window.orbitBridge.copyToClipboard(text);

                    showResult(ok !== false);

                    return;

                } catch (e) {

                    console.error(
                        "Erro ao copiar via bridge:",
                        e
                    );

                }

            }


            const ok = copyWithExecCommand();

            showResult(ok);

        };


        buttonsDiv.appendChild(
            copyBtn
        );

    }


    if (
        role === "assistant" &&
        !isError &&
        origin !== "error"
    ) {

        const regenerateBtn =
            document.createElement("button");


        regenerateBtn.className =
            "regenerate-btn";


        regenerateBtn.textContent =
            "🔄 Regenerar";


        regenerateBtn.type =
            "button";


        regenerateBtn.onclick =
            () => regenerarResposta();


        buttonsDiv.appendChild(
            regenerateBtn
        );

    }


    bubble.appendChild(
        buttonsDiv
    );


    row.appendChild(
        bubble
    );


    messagesEl.appendChild(
        row
    );


    messagesEl.scrollTop =
        messagesEl.scrollHeight;


    const conv =
        findConversation(
            currentConversationId
        );


    if (conv) {

        conv.messages.push({

            role:
            role,

            text:
            text,

            origin:
            origin,

            sources:
                sources || [],

            isError:
                !!isError

        });

    }


    // Persiste a mensagem no banco de dados SQLite
    if (conv && window.orbitBridge && typeof window.orbitBridge.dbSaveMessage === "function") {
        try {
            window.orbitBridge.dbSaveMessage(
                conv.id,
                role,
                text,
                origin,
                JSON.stringify(sources || []),
                !!isError
            );
        } catch (e) {
            console.error("Erro ao salvar mensagem no banco:", e);
        }
    }

}


function escapeHtml(text) {

    const map = {

        '&':
            '&amp;',

        '<':
            '&lt;',

        '>':
            '&gt;',

        '"':
            '&quot;',

        "'":
            '&#039;'

    };


    return text.replace(
        /[&<>"']/g,
        m => map[m]
    );

}


/* =========================================================
   DIGITAÇÃO
   ========================================================= */

function showTyping() {

    removeTyping();


    const row =
        document.createElement("div");


    row.className =
        "msg orbit";


    row.id =
        "typingIndicator";


    const bubble =
        document.createElement("div");


    bubble.className =
        "bubble typing-dots";


    bubble.innerHTML =
        "<span></span>" +
        "<span></span>" +
        "<span></span>";


    row.appendChild(
        bubble
    );


    messagesEl.appendChild(
        row
    );


    messagesEl.scrollTop =
        messagesEl.scrollHeight;

}


function removeTyping() {

    const indicator =
        document.getElementById(
            "typingIndicator"
        );


    if (indicator) {

        indicator.remove();

    }

}


/* =========================================================
   RECEBER RESPOSTA DO JAVA
   ========================================================= */

window.orbitReceive =
    function (jsonResponse) {

        removeTyping();

        let response;


        try {

            response =
                JSON.parse(jsonResponse);

        } catch (e) {

            addMessage(
                "assistant",
                jsonResponse,
                "fallback",
                false,
                []
            );


            busy = false;

            setState("idle");

            return;

        }


        const content =
            response.content || "";

        const origin =
            response.origin || "unknown";

        const sources =
            response.sources || [];


        const success =
            response.success !== false;


        if (success) {

            addMessage(
                "assistant",
                content,
                origin,
                false,
                sources
            );


            totalMessages++;


            if (convCount) {

                convCount.textContent =
                    totalMessages;

            }


            updateProfileStats();

        }


        busy = false;


        if (chatSendBtn) {

            chatSendBtn.disabled =
                false;

        }


        setState("idle");


        if (chatAskInput) {

            chatAskInput.focus();

        }

    };


/* =========================================================
   CARREGAR HISTÓRICO DO BANCO (SQLite)
   ========================================================= */

window.orbitLoadHistory = function (jsonArray) {

    try {

        const historico = JSON.parse(jsonArray);

        conversations = historico.map(conv => ({
            id: conv.id,
            title: conv.title,
            messages: (conv.messages || []).map(m => ({
                role: m.role,
                text: m.text,
                origin: m.origin || "unknown",
                sources: m.sources || [],
                isError: !!m.isError
            }))
        }));

        conversationCounter = conversations.reduce(
            (max, c) => Math.max(max, c.id),
            0
        );

        renderHistory();
        updateProfileStats();

    } catch (e) {
        console.error("Erro ao carregar histórico do banco de dados:", e);
    }
};


/* =========================================================
   REGENERAR RESPOSTA
   ========================================================= */

function regenerarResposta() {

    if (
        busy ||
        !lastQuestion
    ) {

        return;

    }


    const messages =
        messagesEl.querySelectorAll(".msg");


    if (messages.length > 0) {

        const lastMsg =
            messages[messages.length - 1];


        if (
            lastMsg.classList.contains("orbit")
        ) {

            lastMsg.remove();

        }

    }


    const conv =
        findConversation(
            currentConversationId
        );


    if (
        conv &&
        conv.messages.length > 0
    ) {

        const ultimaMsg =
            conv.messages[
            conv.messages.length - 1
                ];


        if (
            ultimaMsg.role === "assistant"
        ) {

            conv.messages.pop();

        }


        if (window.orbitBridge && typeof window.orbitBridge.dbRemoveLastMessage === "function") {
            try {
                window.orbitBridge.dbRemoveLastMessage(conv.id);
            } catch (e) {
                console.error("Erro ao remover última mensagem do banco:", e);
            }
        }

    }


    if (!navigator.onLine) {

        addMessage(
            "assistant",
            friendlyError(null),
            "error",
            true,
            []
        );

        return;

    }


    busy = true;


    if (chatSendBtn) {

        chatSendBtn.disabled =
            true;

    }


    setState("thinking");

    showTyping();


    if (
        window.orbitBridge &&
        typeof window.orbitBridge.ask ===
        "function"
    ) {

        try {

            window.orbitBridge.ask(
                lastQuestion
            );

        } catch (e) {

            window.orbitError(
                JSON.stringify({

                    errorMessage:
                        "Erro ao comunicar com a ponte do Java.",

                    success:
                        false

                })
            );

        }

    } else {

        setTimeout(() => {

            window.orbitReceive(
                JSON.stringify({

                    content:
                        "Resposta simulada (fora do JavaFX).",

                    origin:
                        "fallback",

                    sources:
                        [],

                    success:
                        true

                })
            );

        }, 900);

    }

}


/* =========================================================
   TÍTULO
   ========================================================= */

function generateTitle(text) {

    const t =
        text.trim();


    return t.length <= 32
        ? t
        : t.substring(0, 32) + "…";

}


function createConversationTitle(
    firstMsg
) {

    if (conversationTitle) {

        return;

    }


    conversationTitle =
        generateTitle(firstMsg);


    chatTitle.textContent =
        conversationTitle.toUpperCase();


    conversationCounter++;


    currentConversationId =
        conversationCounter;


    conversations.unshift({

        id:
        conversationCounter,

        title:
        conversationTitle,

        messages:
            []

    });


    renderHistory();

    updateProfileStats();


    // Persiste a nova conversa no banco de dados SQLite
    if (window.orbitBridge && typeof window.orbitBridge.dbCreateConversation === "function") {
        try {
            window.orbitBridge.dbCreateConversation(currentConversationId, conversationTitle);
        } catch (e) {
            console.error("Erro ao salvar conversa no banco:", e);
        }
    }

}


/* =========================================================
   HISTÓRICO (COM EXCLUIR E RENOMEAR)
   ========================================================= */

function findConversation(id) {

    return conversations.find(
        conversation =>
            conversation.id === id
    );

}


function renderHistory() {

    historyList.innerHTML = "";


    if (
        conversations.length === 0
    ) {

        historyList.appendChild(
            historyEmpty
        );

        return;

    }


    conversations.forEach(
        conversation => {

            const itemContainer =
                document.createElement("div");


            itemContainer.className =
                "history-item-container";


            const btn =
                document.createElement(
                    "button"
                );


            btn.className =
                "history-item" +
                (
                    conversation.id ===
                    currentConversationId
                        ? " active"
                        : ""
                );


            btn.textContent =
                conversation.title;


            btn.onclick =
                () =>
                    openConversation(
                        conversation.id
                    );


            itemContainer.appendChild(
                btn
            );


            const actionsDiv =
                document.createElement("div");


            actionsDiv.className =
                "history-item-actions";


            const renameBtn =
                document.createElement("button");


            renameBtn.className =
                "history-action-btn rename-btn";


            renameBtn.title =
                "Renomear conversa";


            renameBtn.innerHTML =
                "✎";


            renameBtn.type =
                "button";


            renameBtn.onclick =
                (e) => {

                    e.stopPropagation();

                    renomearConversa(
                        conversation.id
                    );

                };


            actionsDiv.appendChild(
                renameBtn
            );


            const deleteBtn =
                document.createElement("button");


            deleteBtn.className =
                "history-action-btn delete-btn";


            deleteBtn.title =
                "Excluir conversa";


            deleteBtn.innerHTML =
                "🗑";


            deleteBtn.type =
                "button";


            deleteBtn.onclick =
                (e) => {

                    e.stopPropagation();

                    apagarConversa(
                        conversation.id
                    );

                };


            actionsDiv.appendChild(
                deleteBtn
            );


            itemContainer.appendChild(
                actionsDiv
            );


            historyList.appendChild(
                itemContainer
            );

        }
    );

}


/* =========================================================
   RENOMEAR CONVERSA
   ========================================================= */

function renomearConversa(id) {

    const conv = findConversation(id);

    if (!conv) {
        return;
    }

    showRename(conv.title, (novoNome) => {

        if (novoNome && novoNome.trim()) {

            conv.title = novoNome.trim();

            if (id === currentConversationId) {
                chatTitle.textContent = conv.title.toUpperCase();
            }

            renderHistory();

            if (window.orbitBridge && typeof window.orbitBridge.dbRenameConversation === "function") {
                try {
                    window.orbitBridge.dbRenameConversation(id, conv.title);
                } catch (e) {
                    console.error("Erro ao renomear conversa no banco:", e);
                }
            }
        }
    });
}


/* =========================================================
   APAGAR CONVERSA (COM CONFIRMAÇÃO)
   ========================================================= */

function apagarConversa(id) {

    const conv =
        findConversation(id);


    if (!conv) {

        return;

    }


    showConfirm(

        "Excluir conversa?",

        `Tem certeza que deseja excluir a conversa "${conv.title}"? Esta ação não pode ser desfeita.`,

        (confirmed) => {

            if (confirmed) {

                conversations =
                    conversations.filter(
                        c => c.id !== id
                    );


                if (
                    currentConversationId === id
                ) {

                    currentConversationId =
                        null;

                    conversationTitle =
                        "";

                    startNewChat();

                }


                renderHistory();

                updateProfileStats();


                if (window.orbitBridge && typeof window.orbitBridge.dbDeleteConversation === "function") {
                    try {
                        window.orbitBridge.dbDeleteConversation(id);
                    } catch (e) {
                        console.error("Erro ao apagar conversa no banco:", e);
                    }
                }

            }

        }

    );

}


/* =========================================================
   RECONSTRUIR CHAT
   ========================================================= */

function renderMessages(msgs) {

    messagesEl.innerHTML = "";


    if (
        !msgs ||
        msgs.length === 0
    ) {

        messagesEl.innerHTML =
            EMPTY_CHAT_HTML;

        return;

    }


    msgs.forEach(message => {

        addMessage(

            message.role,

            message.text,

            message.origin ||
            "unknown",

            message.isError ||
            false,

            message.sources ||
            []

        );

    });

}


/* =========================================================
   ABRIR CONVERSA
   ========================================================= */

function openConversation(id) {

    if (busy) {

        return;

    }


    const conv =
        findConversation(id);


    if (!conv) {

        return;

    }


    currentConversationId =
        conv.id;


    conversationTitle =
        conv.title;


    chatTitle.textContent =
        conv.title.toUpperCase();


    renderMessages(
        conv.messages
    );


    renderHistory();


    showView("chat");

}


/* =========================================================
   NOVA CONVERSA
   ========================================================= */

function startNewChat() {

    if (busy) {

        return;

    }


    currentConversationId =
        null;


    conversationTitle =
        "";


    chatTitle.textContent =
        "NOVA CONVERSA";


    messagesEl.innerHTML =
        EMPTY_CHAT_HTML;


    chatAskInput.value =
        "";


    renderHistory();

    updateProfileStats();


    showView("chat");

}


if (sidebarNewChat) {

    sidebarNewChat.addEventListener(
        "click",
        startNewChat
    );

}


/* =========================================================
   FUNÇÕES PARA JAVA
   ========================================================= */

window.orbitNewChat =
    function () {

        startNewChat();

    };


window.orbitClearInput =
    function () {

        if (
            currentView === "chat"
        ) {

            chatAskInput.value =
                "";

            chatAskInput.focus();

        } else {

            homeAskInput.value =
                "";

            homeAskInput.focus();

        }

    };


window.orbitSubmit =
    function () {

        if (
            currentView === "chat" &&
            chatAskBar
        ) {

            chatAskBar.requestSubmit();

        } else if (homeAskBar) {

            homeAskBar.requestSubmit();

        }

    };


/* =========================================================
   PERFIL
   ========================================================= */

function updateProfileNameUI(nome) {

    const valor =
        (nome || "")
            .trim()
            .replace(/\s+/g, " ");


    const inicial =
        valor
            ? valor
                .charAt(0)
                .toUpperCase()
            : "O";


    if (profileAvatar) {

        profileAvatar.textContent =
            inicial;

    }


    const counter =
        document.getElementById(
            "profileNameCounter"
        );


    if (counter) {

        counter.textContent =
            valor.length + "/24";

    }


    const greeting =
        document.getElementById(
            "profileGreeting"
        );


    if (greeting) {

        if (valor) {

            greeting.textContent =
                "Que bom ter você por aqui, " +
                valor +
                ".";

        } else {

            greeting.textContent =
                "Personalize como o Orbit deve chamar você.";

        }

    }

}


function loadProfile() {

    let nome = "";


    try {

        nome =
            localStorage.getItem(
                "orbit-username"
            ) || "";


    } catch (e) {

        console.error(
            "Não foi possível carregar o perfil:",
            e
        );

    }


    if (profileNameInput) {

        profileNameInput.value =
            nome;

    }


    updateProfileNameUI(
        nome
    );

}


function saveProfile() {

    if (!profileNameInput) {

        return;

    }


    const nome =
        profileNameInput.value
            .trim()
            .replace(/\s+/g, " ");


    profileNameInput.value =
        nome;


    try {

        localStorage.setItem(
            "orbit-username",
            nome
        );

    } catch (e) {

        console.error(
            "Não foi possível salvar o perfil:",
            e
        );

        return;

    }


    updateProfileNameUI(
        nome
    );


    if (saveProfileBtn) {

        const label =
            saveProfileBtn.querySelector(
                "span:first-child"
            );


        const arrow =
            saveProfileBtn.querySelector(
                ".profile-save-arrow"
            );


        if (label) {

            label.textContent =
                "Alterações salvas";

        }


        if (arrow) {

            arrow.textContent =
                "✓";

        }


        saveProfileBtn.classList.add(
            "saved"
        );


        saveProfileBtn.disabled =
            true;


        setTimeout(
            () => {

                if (label) {

                    label.textContent =
                        "Salvar alterações";

                }


                if (arrow) {

                    arrow.textContent =
                        "→";

                }


                saveProfileBtn.classList.remove(
                    "saved"
                );


                saveProfileBtn.disabled =
                    false;

            },
            1600
        );

    }

}


function updateProfileStats() {

    if (profileMsgCount) {

        profileMsgCount.textContent =
            totalMessages;

    }


    if (profileConvCount) {

        profileConvCount.textContent =
            conversations.length;

    }

}


/* =========================================================
   EVENTOS DO PERFIL
   ========================================================= */

if (profileNameInput) {

    profileNameInput.addEventListener(
        "input",
        () => {

            updateProfileNameUI(
                profileNameInput.value
            );

        }
    );


    profileNameInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                saveProfile();

            }

        }
    );

}


if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        saveProfile
    );

}


if (sidebarProfileBtn) {

    sidebarProfileBtn.addEventListener(
        "click",
        () => {

            loadProfile();

            updateProfileStats();

            showView("profile");


            setTimeout(
                () => {

                    if (
                        profileNameInput
                    ) {

                        profileNameInput.focus();

                    }

                },
                120
            );

        }
    );

}


/* =========================================================
   CLIPBOARD
   ========================================================= */

async function pasteInto(inputEl) {

    if (!inputEl) {

        return;

    }


    try {

        let texto = "";


        if (
            window.orbitBridge &&
            typeof window.orbitBridge.pasteFromClipboard ===
            "function"
        ) {

            texto =
                window.orbitBridge
                    .pasteFromClipboard();

        }

        else if (
            navigator.clipboard &&
            typeof navigator.clipboard.readText ===
            "function"
        ) {

            texto =
                await navigator.clipboard.readText();

        }


        if (texto) {

            inputEl.value =
                texto;


            inputEl.dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true
                    }
                )
            );


            inputEl.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true
                    }
                )
            );

        }


        inputEl.focus();


    } catch (e) {

        console.error(
            "Erro ao colar:",
            e
        );


        inputEl.focus();

    }

}


if (homePasteBtn) {

    homePasteBtn.addEventListener(
        "click",
        () =>
            pasteInto(
                homeAskInput
            )
    );

}


if (chatPasteBtn) {

    chatPasteBtn.addEventListener(
        "click",
        () =>
            pasteInto(
                chatAskInput
            )
    );

}


/* =========================================================
   ENVIO DE MENSAGENS
   ========================================================= */

function sendMessage(text) {

    text =
        text.trim();


    if (
        !text ||
        busy
    ) {

        return;

    }


    if (!navigator.onLine) {

        addMessage(
            "assistant",
            friendlyError(null),
            "error",
            true,
            []
        );

        return;

    }


    busy = true;


    if (chatSendBtn) {

        chatSendBtn.disabled =
            true;

    }


    createConversationTitle(
        text
    );


    addMessage(
        "user",
        text,
        "user",
        false,
        []
    );


    totalMessages++;


    if (convCount) {

        convCount.textContent =
            totalMessages;

    }


    updateProfileStats();


    showView("chat");


    setState(
        "thinking"
    );


    showTyping();


    lastQuestion =
        text;

    lastQuestionConversationId =
        currentConversationId;


    if (
        window.orbitBridge &&
        typeof window.orbitBridge.ask ===
        "function"
    ) {

        try {

            window.orbitBridge.ask(
                text
            );

        } catch (e) {

            window.orbitError(
                JSON.stringify({

                    errorMessage:
                        "Erro ao comunicar com a ponte do Java.",

                    success:
                        false

                })
            );

        }

    } else {

        setTimeout(
            () => {

                window.orbitReceive(
                    JSON.stringify({

                        content:
                            "Resposta simulada (fora do JavaFX).",

                        origin:
                            "fallback",

                        sources:
                            [],

                        success:
                            true

                    })
                );

            },
            900
        );

    }

}


/* =========================================================
   FORM HOME
   ========================================================= */

if (homeAskBar) {

    homeAskBar.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const value =
                homeAskInput.value;


            homeAskInput.value =
                "";


            if (value) {

                sendMessage(
                    value
                );

            }

        }
    );

}


/* =========================================================
   FORM CHAT
   ========================================================= */

if (chatAskBar) {

    chatAskBar.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const value =
                chatAskInput.value;


            chatAskInput.value =
                "";


            if (value) {

                sendMessage(
                    value
                );

            }

        }
    );

}


/* =========================================================
   PILLS (SUGESTÕES RÁPIDAS)
   ========================================================= */

document
    .querySelectorAll(".pill")
    .forEach(pill => {

        pill.addEventListener(
            "click",
            () => {

                showView("chat");


                sendMessage(
                    pill.dataset.q
                );

            }
        );

    });


/* =========================================================
   ATALHOS
   ========================================================= */

function toggleShortcuts(
    force
) {

    if (!shortcutsModal) {

        return;

    }


    const open =
        force !== undefined
            ? force
            : !shortcutsModal.classList.contains(
                "open"
            );


    shortcutsModal.classList.toggle(
        "open",
        open
    );

}


if (shortcutsBtn) {

    shortcutsBtn.addEventListener(
        "click",
        () =>
            toggleShortcuts(true)
    );

}


if (closeShortcuts) {

    closeShortcuts.addEventListener(
        "click",
        () =>
            toggleShortcuts(false)
    );

}


if (shortcutsModal) {

    shortcutsModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                shortcutsModal
            ) {

                toggleShortcuts(false);

            }

        }
    );

}


/* =========================================================
   ATALHOS DE TECLADO
   ========================================================= */

window.addEventListener(
    "keydown",
    event => {

        const alvo =
            document.activeElement;


        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            (
                alvo === chatAskInput ||
                alvo === homeAskInput
            )
        ) {

            event.preventDefault();

            window.orbitSubmit();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "n"
        ) {

            event.preventDefault();

            window.orbitNewChat();

        }


        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "l"
        ) {

            event.preventDefault();

            window.orbitClearInput();

        }


        if (
            event.ctrlKey &&
            event.key === "/"
        ) {

            event.preventDefault();

            toggleShortcuts();

        }

    }
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initTheme();

        setState("idle");

        renderHistory();

        loadProfile();

        updateProfileStats();

        // Nota: o histórico não é renderizado da memória local aqui —
        // ele chega do Java via window.orbitLoadHistory(), disparado
        // pelo Main.java assim que o bridge está pronto.

    }
);