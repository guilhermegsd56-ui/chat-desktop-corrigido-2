/* =========================================================
   ORBIT AI
   SISTEMA DE NAVEGAÇÃO + CHAT
   ========================================================= */


/* =========================================================
   ELEMENTOS
   ========================================================= */

const views = document.querySelectorAll('.view');

const logoBtn = document.getElementById('logoBtn');
const profileBtn = document.getElementById('profileBtn');

const backHomeBtn = document.getElementById('backHomeBtn');
const backHomeBtn2 = document.getElementById('backHomeBtn2');

const newChatBtn = document.getElementById('newChatBtn');


/* =========================================================
   HOME
   ========================================================= */

const orbit = document.getElementById('orbitAI');

const homeAskBar =
    document.getElementById('homeAskBar');

const homeAskInput =
    document.getElementById('homeAskInput');


/* =========================================================
   CHAT
   ========================================================= */

const messagesEl =
    document.getElementById('messages');

const originalEmptyChat =
    document.getElementById('emptyChat');

const chatAskBar =
    document.getElementById('chatAskBar');

const chatAskInput =
    document.getElementById('chatAskInput');

const chatSendBtn =
    document.getElementById('chatSendBtn');

const stateLabel =
    document.getElementById('stateLabel');

const miniOrbit =
    document.getElementById('miniOrbit');

const convCountEl =
    document.getElementById('convCount');


/* =========================================================
   ESTADO
   ========================================================= */

let currentView = 'home';

let turns = 0;

let busy = false;


/*
 * Guarda uma cópia do estado inicial do chat.
 *
 * Assim, quando o usuário clicar em "Nova conversa",
 * não precisamos reaproveitar uma referência antiga do DOM.
 */

const emptyChatTemplate =
    originalEmptyChat
        ? originalEmptyChat.cloneNode(true)
        : null;


/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showView(name) {

    const targetId =
        'view-' + name;

    views.forEach(view => {

        const isTarget =
            view.id === targetId;

        view.classList.toggle(
            'active',
            isTarget
        );

        view.setAttribute(
            'aria-hidden',
            isTarget ? 'false' : 'true'
        );
    });


    currentView = name;


    /*
     * Pequeno delay para permitir que o WebView
     * finalize o cálculo do layout antes do focus.
     */

    if (name === 'chat') {

        requestAnimationFrame(() => {

            refreshChatLayout();

            setTimeout(() => {

                if (
                    chatAskInput &&
                    !busy
                ) {
                    chatAskInput.focus();
                }

            }, 150);

        });
    }
}


/* =========================================================
   HOME
   ========================================================= */

function goHome() {
    showView('home');

    if (homeAskInput) {

        setTimeout(() => {

            homeAskInput.focus();

        }, 100);
    }
}


/* =========================================================
   EVENTOS DE NAVEGAÇÃO
   ========================================================= */

if (logoBtn) {

    logoBtn.addEventListener(
        'click',
        goHome
    );
}


if (profileBtn) {

    profileBtn.addEventListener(
        'click',
        () => {

            showView('profile');

        }
    );
}


if (backHomeBtn) {

    backHomeBtn.addEventListener(
        'click',
        goHome
    );
}


if (backHomeBtn2) {

    backHomeBtn2.addEventListener(
        'click',
        goHome
    );
}


/* =========================================================
   ORBIT HOME STATE
   ========================================================= */

function setHomeState(state) {

    if (!orbit) {
        return;
    }

    orbit.classList.remove(
        'idle',
        'listening',
        'thinking',
        'responding'
    );

    orbit.classList.add(state);
}


/* =========================================================
   HOME INPUT
   ========================================================= */

if (homeAskInput) {

    homeAskInput.addEventListener(
        'focus',
        () => {

            setHomeState('listening');

        }
    );


    homeAskInput.addEventListener(
        'input',
        () => {

            setHomeState('listening');

        }
    );


    homeAskInput.addEventListener(
        'blur',
        () => {

            if (
                !homeAskInput.value.trim()
            ) {

                setHomeState('idle');

            }
        }
    );
}


/* =========================================================
   HOME ASK BAR
   ========================================================= */

if (homeAskBar) {

    homeAskBar.addEventListener(
        'submit',
        event => {

            event.preventDefault();

            const question =
                homeAskInput
                    ? homeAskInput.value.trim()
                    : '';

            if (!question) {
                return;
            }

            if (homeAskInput) {
                homeAskInput.value = '';
            }

            setHomeState('idle');

            goToChatWith(question);

        }
    );
}


/* =========================================================
   QUICK QUESTIONS
   ========================================================= */

document
    .querySelectorAll('#view-home .pill')
    .forEach(pill => {

        pill.addEventListener(
            'click',
            () => {

                const question =
                    pill.dataset.q;

                if (!question) {
                    return;
                }

                goToChatWith(question);

            }
        );

    });


/* =========================================================
   IR PARA CHAT
   ========================================================= */

function goToChatWith(question) {

    showView('chat');

    /*
     * Aguarda o layout do chat ser ativado
     * antes de enviar a mensagem.
     */

    requestAnimationFrame(() => {

        setTimeout(() => {

            sendMessage(question);

        }, 80);

    });
}


/* =========================================================
   CHAT STATE
   ========================================================= */

function setChatState(state) {

    if (miniOrbit) {

        miniOrbit.classList.remove(
            'idle',
            'listening',
            'thinking',
            'responding'
        );

        miniOrbit.classList.add(state);
    }


    if (stateLabel) {

        const labels = {

            idle:
                'online',

            listening:
                'digitando...',

            thinking:
                'pensando...',

            responding:
                'respondendo...'

        };

        stateLabel.textContent =
            labels[state] || 'online';
    }
}


/* =========================================================
   SCROLL
   ========================================================= */

function scrollToBottom() {

    if (!messagesEl) {
        return;
    }

    requestAnimationFrame(() => {

        messagesEl.scrollTop =
            messagesEl.scrollHeight;

    });
}


/* =========================================================
   REFRESH DO LAYOUT
   ========================================================= */

function refreshChatLayout() {

    if (
        currentView !== 'chat' ||
        !messagesEl
    ) {
        return;
    }


    /*
     * Força o navegador/WebView a recalcular
     * as dimensões do container.
     */

    const shell =
        document.querySelector('.chat-shell');

    if (!shell) {
        return;
    }


    requestAnimationFrame(() => {

        const width =
            shell.offsetWidth;

        const height =
            shell.offsetHeight;


        /*
         * Apenas leitura das dimensões.
         *
         * Isso força o WebView a completar
         * o cálculo do layout sem remover elementos.
         */

        void width;
        void height;


        scrollToBottom();

    });
}


/* =========================================================
   CRIAR NOVO EMPTY CHAT
   ========================================================= */

function restoreEmptyChat() {

    if (!messagesEl) {
        return;
    }


    messagesEl.replaceChildren();


    if (emptyChatTemplate) {

        const newEmpty =
            emptyChatTemplate.cloneNode(true);

        newEmpty.id = 'emptyChat';

        messagesEl.appendChild(newEmpty);

    } else {

        /*
         * Fallback caso o HTML não possua
         * o emptyChat original.
         */

        const empty =
            document.createElement('div');

        empty.className =
            'empty-chat';

        empty.id =
            'emptyChat';

        empty.innerHTML = `
            <div class="big-orbit">

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
        `;

        messagesEl.appendChild(empty);
    }
}


/* =========================================================
   ADICIONAR MENSAGEM
   ========================================================= */

function addMessage(role, text) {

    if (!messagesEl) {
        return null;
    }


    /*
     * Remove somente o empty state atual.
     *
     * Não usamos mais a referência antiga.
     */

    const currentEmpty =
        document.getElementById('emptyChat');

    if (currentEmpty) {

        currentEmpty.remove();

    }


    const wrap =
        document.createElement('div');


    wrap.className =
        'msg ' +
        (
            role === 'user'
                ? 'user'
                : 'orbit'
        );


    const bubble =
        document.createElement('div');


    bubble.className =
        'bubble';


    bubble.textContent =
        text || '';


    wrap.appendChild(
        bubble
    );


    const actions =
        createMessageActions(text || '');

    if (actions) {

        wrap.appendChild(
            actions
        );

    }


    messagesEl.appendChild(
        wrap
    );


    scrollToBottom();


    return bubble;
}


/* =========================================================
   AÇÕES DA MENSAGEM (COPIAR)
   ========================================================= */

function createMessageActions(text) {

    if (!text) {
        return null;
    }

    const actions =
        document.createElement('div');

    actions.className =
        'msg-actions';

    const copyBtn =
        document.createElement('button');

    copyBtn.type =
        'button';

    copyBtn.className =
        'copy-btn';

    copyBtn.setAttribute(
        'aria-label',
        'Copiar mensagem'
    );

    copyBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/>
            <path d="M5 15H4C3.44772 15 3 14.5523 3 14V4C3 3.44772 3.44772 3 4 3H14C14.5523 3 15 3.44772 15 4V5" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        <span class="copy-label">Copiar</span>
    `;

    copyBtn.addEventListener(
        'click',
        () => {

            copyMessageText(
                text,
                copyBtn
            );

        }
    );

    actions.appendChild(
        copyBtn
    );

    return actions;
}


/* =========================================================
   COPIAR TEXTO PARA A ÁREA DE TRANSFERÊNCIA
   ========================================================= */

function copyMessageText(text, btn) {

    const onSuccess = () => {

        showCopyFeedback(
            btn,
            true
        );

    };

    const onError = () => {

        showCopyFeedback(
            btn,
            false
        );

    };


    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(text)
            .then(onSuccess)
            .catch(() => {

                if (fallbackCopy(text)) {

                    onSuccess();

                } else {

                    onError();

                }

            });

    } else {

        if (fallbackCopy(text)) {

            onSuccess();

        } else {

            onError();

        }

    }
}


/* =========================================================
   FALLBACK DE CÓPIA (sem clipboard API)
   ========================================================= */

function fallbackCopy(text) {

    try {

        const textarea =
            document.createElement('textarea');

        textarea.value =
            text;

        textarea.style.position =
            'fixed';

        textarea.style.opacity =
            '0';

        document.body.appendChild(
            textarea
        );

        textarea.focus();
        textarea.select();

        const ok =
            document.execCommand('copy');

        document.body.removeChild(
            textarea
        );

        return ok;

    } catch (error) {

        console.error(
            'Falha no fallback de cópia:',
            error
        );

        return false;

    }
}


/* =========================================================
   FEEDBACK VISUAL DE CÓPIA
   ========================================================= */

function showCopyFeedback(btn, success) {

    if (!btn) {
        return;
    }

    const label =
        btn.querySelector('.copy-label');

    if (!label) {
        return;
    }

    const originalText =
        'Copiar';

    if (btn._copyTimeout) {

        clearTimeout(
            btn._copyTimeout
        );

    }

    if (success) {

        label.textContent =
            'Copiado!';

        btn.classList.add(
            'copied'
        );

    } else {

        label.textContent =
            'Erro ao copiar';

    }

    const actions =
        btn.closest('.msg-actions');

    if (actions) {

        actions.classList.add(
            'is-visible'
        );

    }

    btn._copyTimeout =
        setTimeout(
            () => {

                label.textContent =
                    originalText;

                btn.classList.remove(
                    'copied'
                );

                if (actions) {

                    actions.classList.remove(
                        'is-visible'
                    );

                }

            },
            1600
        );
}


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function addTypingIndicator() {

    if (!messagesEl) {
        return;
    }


    removeTypingIndicator();


    /*
     * Remove empty state caso ainda exista.
     */

    const currentEmpty =
        document.getElementById('emptyChat');

    if (currentEmpty) {
        currentEmpty.remove();
    }


    const wrap =
        document.createElement('div');


    wrap.className =
        'msg orbit';


    wrap.id =
        'typingIndicator';


    const bubble =
        document.createElement('div');


    bubble.className =
        'bubble typing-dots';


    bubble.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    wrap.appendChild(
        bubble
    );


    messagesEl.appendChild(
        wrap
    );


    scrollToBottom();
}


/* =========================================================
   REMOVER TYPING
   ========================================================= */

function removeTypingIndicator() {

    const indicator =
        document.getElementById(
            'typingIndicator'
        );


    if (indicator) {

        indicator.remove();

    }
}


/* =========================================================
   ENVIAR MENSAGEM
   ========================================================= */

function sendMessage(text) {

    text =
        (text || '').trim();


    if (!text) {
        return;
    }


    if (busy) {
        return;
    }


    if (
        !messagesEl ||
        !chatAskInput ||
        !chatSendBtn
    ) {
        return;
    }


    busy = true;


    chatSendBtn.disabled =
        true;


    addMessage(
        'user',
        text
    );


    setChatState(
        'thinking'
    );


    addTypingIndicator();


    /*
     * =====================================================
     * JAVA BRIDGE
     * =====================================================
     *
     * O JavaFX deve disponibilizar:
     *
     * window.javaBridge
     *
     * com:
     *
     * sendMessage()
     *
     */


    if (
        window.javaBridgeReady &&
        window.javaBridge &&
        typeof window.javaBridge.sendMessage ===
        'function'
    ) {

        try {

            window.javaBridge.sendMessage(
                text
            );

        } catch (error) {

            console.error(
                'Erro ao chamar javaBridge.sendMessage:',
                error
            );


            orbitError(
                'Não consegui enviar sua mensagem ao Orbit. Tente novamente.'
            );
        }


    } else {

        /*
         * A ponte Java ainda não está disponível.
         */

        removeTypingIndicator();


        addMessage(
            'assistant',
            'O Orbit ainda está inicializando. Aguarde alguns segundos e tente novamente.'
        );


        setChatState(
            'idle'
        );


        busy = false;


        chatSendBtn.disabled =
            false;
    }
}


/* =========================================================
   RESPOSTA RECEBIDA DO JAVA
   ========================================================= */

window.orbitReceive =
    function(reply) {

        removeTypingIndicator();


        setChatState(
            'responding'
        );


        addMessage(
            'assistant',
            reply
        );


        turns++;


        if (convCountEl) {

            convCountEl.textContent =
                turns.toString();

        }


        setTimeout(
            () => {

                if (!busy) {

                    setChatState(
                        'idle'
                    );

                }

            },
            900
        );


        busy = false;


        if (chatSendBtn) {

            chatSendBtn.disabled =
                false;

        }


        if (chatAskInput) {

            setTimeout(
                () => {

                    chatAskInput.focus();

                },
                100
            );

        }
    };


/* =========================================================
   ERRO RECEBIDO DO JAVA
   ========================================================= */

window.orbitError =
    function(message) {

        removeTypingIndicator();


        addMessage(
            'assistant',
            message ||
            'Tive um problema para me conectar agora. Pode tentar novamente em instantes?'
        );


        setChatState(
            'idle'
        );


        busy = false;


        if (chatSendBtn) {

            chatSendBtn.disabled =
                false;

        }
    };


/* =========================================================
   CHAT INPUT
   ========================================================= */

if (chatAskBar) {

    chatAskBar.addEventListener(
        'submit',
        event => {

            event.preventDefault();


            if (!chatAskInput) {
                return;
            }


            const question =
                chatAskInput.value.trim();


            if (!question) {
                return;
            }


            if (busy) {
                return;
            }


            chatAskInput.value =
                '';


            sendMessage(
                question
            );

        }
    );
}


/* =========================================================
   CHAT INPUT STATE
   ========================================================= */

if (chatAskInput) {

    chatAskInput.addEventListener(
        'focus',
        () => {

            if (!busy) {

                setChatState(
                    'listening'
                );

            }

        }
    );


    chatAskInput.addEventListener(
        'input',
        () => {

            if (!busy) {

                setChatState(
                    'listening'
                );

            }

        }
    );


    chatAskInput.addEventListener(
        'blur',
        () => {

            if (
                !busy &&
                !chatAskInput.value.trim()
            ) {

                setChatState(
                    'idle'
                );

            }

        }
    );
}


/* =========================================================
   NOVA CONVERSA
   ========================================================= */

function startNewChat() {

    /*
     * Não permitir reset enquanto o Orbit
     * ainda estiver respondendo.
     */

    if (busy) {
        return;
    }


    /*
     * Limpa as mensagens sem destruir
     * o container principal do chat.
     */

    restoreEmptyChat();


    turns = 0;


    if (convCountEl) {

        convCountEl.textContent =
            '0';

    }


    if (chatAskInput) {

        chatAskInput.value =
            '';

    }


    removeTypingIndicator();


    setChatState(
        'idle'
    );


    /*
     * Informa ao backend Java que
     * uma nova conversa começou.
     */

    if (
        window.javaBridgeReady &&
        window.javaBridge &&
        typeof window.javaBridge.newChat ===
        'function'
    ) {

        try {

            window.javaBridge.newChat();

        } catch (error) {

            console.error(
                'Erro ao iniciar nova conversa:',
                error
            );

        }
    }


    /*
     * Continua na tela de chat.
     */

    showView(
        'chat'
    );


    requestAnimationFrame(() => {

        refreshChatLayout();


        setTimeout(() => {

            if (chatAskInput) {

                chatAskInput.focus();

            }

        }, 150);

    });
}


/* =========================================================
   BOTÃO NOVA CONVERSA
   ========================================================= */

if (newChatBtn) {

    newChatBtn.addEventListener(
        'click',
        event => {

            event.preventDefault();

            startNewChat();

        }
    );
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function initializeOrbit() {

    /*
     * Estado inicial
     */

    setHomeState(
        'idle'
    );


    setChatState(
        'idle'
    );


    /*
     * Garante que somente a Home
     * esteja ativa inicialmente.
     */

    showView(
        'home'
    );


    /*
     * Estado inicial do contador.
     */

    if (convCountEl) {

        convCountEl.textContent =
            turns.toString();

    }
}


/* =========================================================
   INICIAR
   ========================================================= */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        initializeOrbit
    );

} else {

    initializeOrbit();

}