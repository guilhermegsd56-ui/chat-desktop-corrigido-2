/* ===== BASE: referências e navegação de telas ===== */
const themeStyle=document.getElementById("themeStyle"),themeToggle=document.getElementById("themeToggle"),
    themeText=document.getElementById("themeText"),themeIcon=document.getElementById("themeIcon");
const sidebarNewChat=document.getElementById("sidebarNewChat"),sidebarProfileBtn=document.getElementById("sidebarProfileBtn"),
    logoBtn=document.getElementById("logoBtn"),backHomeBtn=document.getElementById("backHomeBtn");
const historyList=document.getElementById("historyList"),historyEmpty=document.getElementById("historyEmpty"),
    chatTitle=document.getElementById("chatTitle"),convCount=document.getElementById("convCount");
const messagesEl=document.getElementById("messages"),emptyChat=document.getElementById("emptyChat");
const chatAskBar=document.getElementById("chatAskBar"),chatAskInput=document.getElementById("chatAskInput"),chatSendBtn=document.getElementById("chatSendBtn");
const homeAskBar=document.getElementById("homeAskBar"),homeAskInput=document.getElementById("homeAskInput");
const stateLabel=document.getElementById("stateLabel"),orbitAI=document.getElementById("orbitAI");

const shortcutsBtn=document.getElementById("shortcutsBtn"),shortcutsModal=document.getElementById("shortcutsModal"),
    closeShortcuts=document.getElementById("closeShortcuts");

const profileNameInput=document.getElementById("profileNameInput"),profileAvatar=document.getElementById("profileAvatar"),
    saveProfileBtn=document.getElementById("saveProfileBtn"),profileMsgCount=document.getElementById("profileMsgCount"),
    profileConvCount=document.getElementById("profileConvCount");

const homePasteBtn=document.getElementById("homePasteBtn"),chatPasteBtn=document.getElementById("chatPasteBtn");

let currentView="home",busy=false,conversationTitle="",conversations=[],conversationCounter=0,totalMessages=0,currentConversationId=null;

/* Marcação usada para restaurar a tela de chat vazia (nova conversa / conversa sem mensagens) */
const EMPTY_CHAT_HTML=`<div id="emptyChat" class="empty-chat">
      <div class="mini-orbit"><div class="blob-wrap"><div class="blob"></div><div class="blob b2"></div><div class="blob core"></div></div></div>
      <p>Envie uma mensagem para começar a conversar com o Orbit.</p></div>`;

function showView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    const t=document.getElementById("view-"+name);
    if(t){t.classList.add("active");currentView=name;if(name==="chat")setTimeout(()=>chatAskInput.focus(),150);}
}
if(logoBtn)logoBtn.addEventListener("click",()=>showView("home"));
if(backHomeBtn)backHomeBtn.addEventListener("click",()=>showView("home"));

function setState(state){
    if(orbitAI){orbitAI.classList.remove("idle","listening","thinking","responding");orbitAI.classList.add(state);}
    const labels={idle:"online",listening:"digitando...",thinking:"pensando...",responding:"respondendo..."};
    if(stateLabel)stateLabel.textContent=labels[state]||"online";
}

/* ===== PARTE 2: TEMA CLARO/ESCURO ===== */
function applyTheme(theme){
    theme=(theme==="light")?"light":"dark";
    const novoLink=document.createElement("link");
    novoLink.rel="stylesheet";
    novoLink.id="themeStyle";
    novoLink.href="themes/"+theme+".css?v="+Date.now();
    novoLink.onload=()=>{
        const antigo=document.getElementById("themeStyle");
        if(antigo && antigo!==novoLink) antigo.remove();
    };
    document.head.appendChild(novoLink);
    if(themeText)themeText.textContent=theme==="dark"?"Tema claro":"Tema escuro";
    if(themeIcon)themeIcon.textContent=theme==="dark"?"☀":"☾";
    try{localStorage.setItem("orbit-theme",theme);}catch(e){}
}
function initTheme(){
    let saved="dark";
    try{saved=localStorage.getItem("orbit-theme")||"dark";}catch(e){}
    applyTheme(saved);
}
if(themeToggle)themeToggle.addEventListener("click",()=>{
    let atual="dark";
    try{atual=localStorage.getItem("orbit-theme")||"dark";}catch(e){}
    applyTheme(atual==="dark"?"light":"dark");
});

/* ===== PARTE 1: TRATAMENTO DE ERROS ===== */
function friendlyError(msg){
    if(!navigator.onLine) return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
    if(!msg) return "Ocorreu um erro inesperado. Tente novamente.";
    const m=msg.toLowerCase();
    if(m.includes("inválida")||m.includes("expirou")) return "Chave de API inválida ou expirada. Verifique a configuração.";
    if(m.includes("limite")) return "Limite de uso da API atingido. Aguarde um instante e tente novamente.";
    if(m.includes("indisponível")||m.includes("servidor")) return "O servidor da IA está indisponível no momento. Tente novamente em instantes.";
    return msg;
}
window.orbitError=function(errorMsg){
    removeTyping();
    addMessage("assistant",friendlyError(errorMsg),true);
    busy=false;chatSendBtn.disabled=false;setState("idle");
};

/* ===== PARTE 4: BALÕES DE MENSAGEM (com copiar em user e IA) ===== */
/* PARTE 8: parâmetro "persist" controla se a mensagem é salva na conversa atual
   (usado como false ao reconstruir uma conversa a partir do histórico, para não duplicar). */
function addMessage(role,text,isError,persist){
    if(persist===undefined) persist=true;
    const emptyNode=document.getElementById("emptyChat");
    if(emptyNode&&emptyNode.parentNode===messagesEl) emptyNode.remove();
    const row=document.createElement("div");
    row.className="msg "+(role==="user"?"user":"orbit");
    const bubble=document.createElement("div");
    bubble.className="bubble"+(isError?" error-bubble":"");
    bubble.textContent=text;
    if(!isError){
        const btn=document.createElement("button");
        btn.className="copy-btn";btn.textContent="📋 Copiar";
        btn.onclick=()=>{
            copyText(text)
                .then(()=>{btn.textContent="Copiado!";setTimeout(()=>btn.textContent="📋 Copiar",1800);})
                .catch(()=>{btn.textContent="Erro ao copiar";setTimeout(()=>btn.textContent="📋 Copiar",1800);});
        };
        bubble.appendChild(btn);
    }
    row.appendChild(bubble);messagesEl.appendChild(row);messagesEl.scrollTop=messagesEl.scrollHeight;

    if(persist){
        const conv=findConversation(currentConversationId);
        if(conv) conv.messages.push({role:role,text:text,isError:!!isError});
    }
}
function showTyping(){
    removeTyping();
    const row=document.createElement("div");row.className="msg orbit";row.id="typingIndicator";
    const bubble=document.createElement("div");bubble.className="bubble typing-dots";
    bubble.innerHTML="<span></span><span></span><span></span>";
    row.appendChild(bubble);messagesEl.appendChild(row);messagesEl.scrollTop=messagesEl.scrollHeight;
}
function removeTyping(){const i=document.getElementById("typingIndicator");if(i)i.remove();}

window.orbitReceive=function(response){
    removeTyping();addMessage("assistant",response);
    totalMessages++;convCount.textContent=totalMessages;
    busy=false;chatSendBtn.disabled=false;setState("idle");chatAskInput.focus();
};

/* ===== PARTE 6: TÍTULO AUTOMÁTICO ===== */
function generateTitle(text){
    const t=text.trim();
    return t.length<=32?t:t.substring(0,32)+"…";
}
function createConversationTitle(firstMsg){
    if(conversationTitle) return;
    conversationTitle=generateTitle(firstMsg);
    chatTitle.textContent=conversationTitle.toUpperCase();
    conversationCounter++;
    currentConversationId=conversationCounter;
    conversations.unshift({id:conversationCounter,title:conversationTitle,messages:[]});
    renderHistory();
}

/* ===== PARTE 5 / PARTE 8: BARRA LATERAL / HISTÓRICO ===== */
function findConversation(id){
    return conversations.find(c=>c.id===id);
}
function renderHistory(){
    historyList.innerHTML="";
    if(conversations.length===0){historyList.appendChild(historyEmpty);return;}
    conversations.forEach(conv=>{
        const btn=document.createElement("button");
        btn.className="history-item"+(conv.id===currentConversationId?" active":"");
        btn.textContent=conv.title;
        btn.onclick=()=>openConversation(conv.id);
        historyList.appendChild(btn);
    });
}
/* Reconstrói na tela as mensagens já trocadas em uma conversa salva */
function renderMessages(msgs){
    messagesEl.innerHTML="";
    if(!msgs||msgs.length===0){
        messagesEl.innerHTML=EMPTY_CHAT_HTML;
        return;
    }
    msgs.forEach(m=>addMessage(m.role,m.text,m.isError,false));
}
/* PARTE 8: abre uma conversa do histórico, restaurando título e mensagens */
function openConversation(id){
    if(busy) return;
    const conv=findConversation(id);
    if(!conv) return;
    currentConversationId=conv.id;
    conversationTitle=conv.title;
    chatTitle.textContent=conv.title.toUpperCase();
    renderMessages(conv.messages);
    renderHistory();
    showView("chat");
}
function startNewChat(){
    if(busy) return;
    currentConversationId=null;
    conversationTitle="";
    chatTitle.textContent="NOVA CONVERSA";
    messagesEl.innerHTML=EMPTY_CHAT_HTML;
    chatAskInput.value="";
    renderHistory();
    showView("chat");
}
if(sidebarNewChat)sidebarNewChat.addEventListener("click",startNewChat);

/* ===== funções expostas para o Java chamar via executeScript (Ctrl+N / Ctrl+L) ===== */
window.orbitNewChat=function(){ startNewChat(); };
window.orbitClearInput=function(){
    if(currentView==="chat"){chatAskInput.value="";chatAskInput.focus();}
    else{homeAskInput.value="";homeAskInput.focus();}
};
window.orbitSubmit=function(){
    if(currentView==="chat"&&chatAskBar) chatAskBar.requestSubmit();
    else if(homeAskBar) homeAskBar.requestSubmit();
};

/* ===== PERFIL: nome, avatar e estatísticas ===== */
function loadProfile(){
    let nome="";
    try{nome=localStorage.getItem("orbit-username")||"";}catch(e){}
    if(profileNameInput)profileNameInput.value=nome;
    if(profileAvatar)profileAvatar.textContent=nome?nome.trim()[0].toUpperCase():"O";
}
function saveProfile(){
    if(!profileNameInput) return;
    const nome=profileNameInput.value.trim();
    try{
        localStorage.setItem("orbit-username",nome);
    }catch(e){
        console.error("Não foi possível salvar o perfil:",e);
    }
    if(profileAvatar)profileAvatar.textContent=nome?nome[0].toUpperCase():"O";
    if(saveProfileBtn){
        const original=saveProfileBtn.textContent;
        saveProfileBtn.textContent="Salvo ✓";
        saveProfileBtn.disabled=true;
        setTimeout(()=>{saveProfileBtn.textContent=original;saveProfileBtn.disabled=false;},1500);
    }
}
function updateProfileStats(){
    if(profileMsgCount)profileMsgCount.textContent=totalMessages;
    if(profileConvCount)profileConvCount.textContent=conversations.length;
}
if(saveProfileBtn)saveProfileBtn.addEventListener("click",saveProfile);
if(sidebarProfileBtn)sidebarProfileBtn.addEventListener("click",()=>{loadProfile();updateProfileStats();showView("profile");});

/* ===== COPIAR / COLAR (clipboard) =====
   A WebView do JavaFX não suporta bem navigator.clipboard (sem prompt de
   permissão, promises que nunca resolvem). Por isso usamos a ponte Java
   (window.orbitBridge), que acessa a Clipboard nativa do sistema.
   Mantemos o navigator.clipboard como fallback para quando o script roda
   fora do JavaFX (ex.: abrindo o index.html direto num navegador). */
function copyText(text){
    if(window.orbitBridge&&typeof window.orbitBridge.copyToClipboard==="function"){
        try{
            window.orbitBridge.copyToClipboard(text);
            return Promise.resolve();
        }catch(e){
            return Promise.reject(e);
        }
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
        return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error("Clipboard indisponível"));
}
function readClipboardText(){
    if(window.orbitBridge&&typeof window.orbitBridge.pasteFromClipboard==="function"){
        try{
            // Chamada síncrona: o Java retorna a String diretamente (sem Promise).
            const texto=window.orbitBridge.pasteFromClipboard();
            return Promise.resolve(texto);
        }catch(e){
            return Promise.reject(e);
        }
    }
    if(navigator.clipboard&&navigator.clipboard.readText){
        return navigator.clipboard.readText();
    }
    return Promise.reject(new Error("Clipboard indisponível"));
}
async function pasteInto(inputEl){
    try{
        const texto=await readClipboardText();
        if(texto){
            inputEl.value=texto;
        }
        inputEl.focus();
    }catch(e){
        addMessage("assistant","Não foi possível acessar a área de transferência. Verifique as permissões do sistema.",true);
    }
}
if(homePasteBtn)homePasteBtn.addEventListener("click",()=>pasteInto(homeAskInput));
if(chatPasteBtn)chatPasteBtn.addEventListener("click",()=>pasteInto(chatAskInput));

/* ===== envio de mensagens (ponte com o Java) ===== */
function sendMessage(text){
    text=text.trim();
    if(!text||busy) return;
    if(!navigator.onLine){addMessage("assistant",friendlyError(null),true);return;}

    busy=true;chatSendBtn.disabled=true;
    createConversationTitle(text);
    addMessage("user",text);
    showView("chat");
    setState("thinking");
    showTyping();

    if(window.orbitBridge&&typeof window.orbitBridge.ask==="function"){
        try{window.orbitBridge.ask(text);}catch(e){window.orbitError("Erro ao comunicar com a ponte do Java.");}
    }else{
        setTimeout(()=>window.orbitReceive("Resposta simulada (fora do JavaFX)."),900);
    }
}
if(homeAskBar)homeAskBar.addEventListener("submit",e=>{e.preventDefault();const v=homeAskInput.value;homeAskInput.value="";if(v)sendMessage(v);});
if(chatAskBar)chatAskBar.addEventListener("submit",e=>{e.preventDefault();const v=chatAskInput.value;chatAskInput.value="";if(v)sendMessage(v);});
document.querySelectorAll(".pill").forEach(p=>p.addEventListener("click",()=>{showView("chat");sendMessage(p.dataset.q);}));

/* ===== ATALHOS: exibição do modal de ajuda ===== */
function toggleShortcuts(force){
    if(!shortcutsModal) return;
    const open=force!==undefined?force:!shortcutsModal.classList.contains("open");
    shortcutsModal.classList.toggle("open",open);
}
if(shortcutsBtn)shortcutsBtn.addEventListener("click",()=>toggleShortcuts(true));
if(closeShortcuts)closeShortcuts.addEventListener("click",()=>toggleShortcuts(false));
if(shortcutsModal)shortcutsModal.addEventListener("click",e=>{if(e.target===shortcutsModal)toggleShortcuts(false);});

/* ===== PARTE 3: ATALHOS DE TECLADO ===== */
window.addEventListener("keydown",e=>{
    const alvo=document.activeElement;
    if(e.key==="Enter"&&!e.shiftKey&&(alvo===chatAskInput||alvo===homeAskInput)){
        e.preventDefault();
        window.orbitSubmit();
    }
    if(e.ctrlKey&&e.key.toLowerCase()==="n"){e.preventDefault();window.orbitNewChat();}
    if(e.ctrlKey&&e.key.toLowerCase()==="l"){e.preventDefault();window.orbitClearInput();}
    if(e.ctrlKey&&e.key==="/"){e.preventDefault();toggleShortcuts();}
});

/* ===== inicialização ===== */
document.addEventListener("DOMContentLoaded",()=>{initTheme();setState("idle");renderHistory();loadProfile();});