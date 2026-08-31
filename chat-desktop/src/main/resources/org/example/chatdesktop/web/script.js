/* =========================================================
   ORBIT AI
   SCRIPT PRINCIPAL
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
   ESTADO DO APLICATIVO
   ========================================================= */

let currentView = "home";

let busy = false;

let conversationTitle = "";

let conversations = [];

let conversationCounter = 0;

let totalMessages = 0;

let currentConversationId = null;


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


/* Logo */

if (logoBtn) {

    logoBtn.addEventListener(
        "click",
        () => showView("home")
    );

}


/* Voltar */

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
    function (errorMsg) {

        removeTyping();

        addMessage(
            "assistant",
            friendlyError(errorMsg),
            true
        );


        busy = false;


        if (chatSendBtn) {

            chatSendBtn.disabled =
                false;

        }


        setState("idle");

    };


/* =========================================================
   MENSAGENS
   ========================================================= */

function addMessage(
    role,
    text,
    isError,
    persist
) {

    if (persist === undefined) {

        persist = true;

    }


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


    bubble.textContent =
        text;


    if (!isError) {

        const btn =
            document.createElement("button");


        btn.className =
            "copy-btn";


        btn.textContent =
            "📋 Copiar";


        btn.onclick =
            () => {

                try {

                    /*
                     * =================================================
                     * COPIAR USANDO A BRIDGE DO JAVA
                     * =================================================
                     *
                     * O JavaFX possui acesso direto à área de
                     * transferência do sistema operacional.
                     *
                     * Isso evita os problemas do
                     * navigator.clipboard dentro do WebView.
                     */

                    if (
                        window.orbitBridge &&
                        typeof window.orbitBridge.copyToClipboard ===
                        "function"
                    ) {

                        window.orbitBridge.copyToClipboard(
                            text
                        );


                        btn.textContent =
                            "Copiado!";


                        setTimeout(
                            () => {

                                btn.textContent =
                                    "📋 Copiar";

                            },
                            1800
                        );


                        return;
                    }


                    /*
                     * =================================================
                     * FALLBACK
                     * =================================================
                     *
                     * Caso o projeto esteja sendo executado
                     * fora do JavaFX, tenta utilizar o clipboard
                     * nativo do navegador.
                     */

                    if (
                        navigator.clipboard &&
                        typeof navigator.clipboard.writeText ===
                        "function"
                    ) {

                        navigator.clipboard
                            .writeText(text)
                            .then(() => {

                                btn.textContent =
                                    "Copiado!";


                                setTimeout(
                                    () => {

                                        btn.textContent =
                                            "📋 Copiar";

                                    },
                                    1800
                                );

                            })
                            .catch(() => {

                                btn.textContent =
                                    "Erro ao copiar";


                                setTimeout(
                                    () => {

                                        btn.textContent =
                                            "📋 Copiar";

                                    },
                                    1800
                                );

                            });


                        return;
                    }


                    /*
                     * =================================================
                     * CASO NENHUM MÉTODO ESTEJA DISPONÍVEL
                     * =================================================
                     */

                    btn.textContent =
                        "Erro ao copiar";


                    setTimeout(
                        () => {

                            btn.textContent =
                                "📋 Copiar";

                        },
                        1800
                    );


                } catch (e) {

                    console.error(
                        "Erro ao copiar:",
                        e
                    );


                    btn.textContent =
                        "Erro ao copiar";


                    setTimeout(
                        () => {

                            btn.textContent =
                                "📋 Copiar";

                        },
                        1800
                    );

                }

            };

        bubble.appendChild(btn);

    }


    row.appendChild(bubble);


    messagesEl.appendChild(row);


    messagesEl.scrollTop =
        messagesEl.scrollHeight;


    if (persist) {

        const conv =
            findConversation(
                currentConversationId
            );


        if (conv) {

            conv.messages.push({

                role: role,

                text: text,

                isError:
                    !!isError

            });

        }

    }

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
    function (response) {

        removeTyping();


        addMessage(
            "assistant",
            response
        );


        totalMessages++;


        if (convCount) {

            convCount.textContent =
                totalMessages;

        }


        updateProfileStats();


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

        messages: []

    });


    renderHistory();


    updateProfileStats();

}


/* =========================================================
   HISTÓRICO
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


            historyList.appendChild(
                btn
            );

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
            message.isError,
            false
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


/*
 * Atualiza avatar, contador e saudação.
 */

function updateProfileNameUI(nome) {

    const valor =
        (nome || "")
            .trim()
            .replace(/\s+/g, " ");


    /* Inicial */

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


    /* Contador */

    const counter =
        document.getElementById(
            "profileNameCounter"
        );


    if (counter) {

        counter.textContent =
            valor.length + "/24";

    }


    /* Saudação */

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


/*
 * Recupera o nome salvo.
 */

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


/*
 * Salva o nome.
 */

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


    /* Feedback */

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


/*
 * Estatísticas.
 */

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


/* Digitação */

if (profileNameInput) {

    profileNameInput.addEventListener(
        "input",
        () => {

            updateProfileNameUI(
                profileNameInput.value
            );

        }
    );


    /* ENTER salva */

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


/* Botão salvar */

if (saveProfileBtn) {

    saveProfileBtn.addEventListener(
        "click",
        saveProfile
    );

}


/* Abrir perfil */

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

        let texto =
            "";


        /*
         * =================================================
         * COLAR USANDO A BRIDGE DO JAVA
         * =================================================
         *
         * O método pasteFromClipboard()
         * já está disponível no JSBridge.java.
         */

        if (
            window.orbitBridge &&
            typeof window.orbitBridge.pasteFromClipboard ===
            "function"
        ) {

            texto =
                window.orbitBridge
                    .pasteFromClipboard();

        }


        /*
         * =================================================
         * FALLBACK
         * =================================================
         *
         * Caso a Bridge não esteja disponível,
         * tenta utilizar o clipboard do navegador.
         */

        else if (
            navigator.clipboard &&
            typeof navigator.clipboard.readText ===
            "function"
        ) {

            texto =
                await navigator.clipboard.readText();

        }


        /*
         * =================================================
         * INSERE O TEXTO NO CAMPO
         * =================================================
         */

        if (texto) {

            inputEl.value =
                texto;


            /*
             * Informa aos listeners existentes que
             * o conteúdo do campo foi alterado.
             */

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


        /*
         * Mantém o foco no campo.
         */

        inputEl.focus();


    } catch (e) {

        console.error(
            "Erro ao colar:",
            e
        );


        /*
         * Não cria uma mensagem do Orbit
         * dentro do chat caso o clipboard falhe.
         */

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
   ENVIO
   ========================================================= */

function sendMessage(text) {

    text =
        text.trim();


    if (!text || busy) {

        return;

    }


    if (!navigator.onLine) {

        addMessage(
            "assistant",
            friendlyError(null),
            true
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
        text
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


    /* =====================================================
       PONTE JAVA
       ===================================================== */

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
                "Erro ao comunicar com a ponte do Java."
            );

        }

    } else {

        /*
         * Somente fallback caso o JavaFX
         * não esteja executando.
         */

        setTimeout(
            () => {

                window.orbitReceive(
                    "Resposta simulada (fora do JavaFX)."
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
   PILLS
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

    }
);