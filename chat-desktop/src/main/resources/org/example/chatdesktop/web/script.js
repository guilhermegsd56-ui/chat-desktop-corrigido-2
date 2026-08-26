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

let currentView="home",busy=false,conversationTitle="",conversations=[],conversationCounter=0,totalMessages=0;

function showView(name){
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    const t=document.getElementById("view-"+name);
    if(t){t.classList.add("active");currentView=name;if(name==="chat")setTimeout(()=>chatAskInput.focus(),150);}
}
logoBtn.addEventListener("click",()=>showView("home"));
sidebarProfileBtn.addEventListener("click",()=>showView("profile"));
if(backHomeBtn)backHomeBtn.addEventListener("click",()=>showView("home"));

function setState(state){
    if(orbitAI){orbitAI.classList.remove("idle","listening","thinking","responding");orbitAI.classList.add(state);}
    const labels={idle:"online",listening:"digitando...",thinking:"pensando...",responding:"respondendo..."};
    if(stateLabel)stateLabel.textContent=labels[state]||"online";
}

/* ===== PARTE 2: TEMA CLARO/ESCURO (corrigido para WebView) ===== */
function applyTheme(theme){
    theme=(theme==="light")?"light":"dark";

    const novoLink=document.createElement("link");
    novoLink.rel="stylesheet";
    novoLink.id="themeStyle";
    novoLink.href="themes/"+theme+".css?v="+Date.now(); // cache-buster força reload real

    novoLink.onload=()=>{
        const antigo=document.getElementById("themeStyle");
        if(antigo && antigo!==novoLink) antigo.remove();
    };

    document.head.appendChild(novoLink);

    themeText.textContent=theme==="dark"?"Tema claro":"Tema escuro";
    themeIcon.textContent=theme==="dark"?"☀":"☾";
    try{localStorage.setItem("orbit-theme",theme);}catch(e){}
}
function initTheme(){
    let saved="dark";
    try{saved=localStorage.getItem("orbit-theme")||"dark";}catch(e){}
    applyTheme(saved);
}
themeToggle.addEventListener("click",()=>{
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

/* ===== PARTE 4: BALÕES DE MENSAGEM ===== */
function addMessage(role,text,isError){
    if(emptyChat&&emptyChat.parentNode===messagesEl) emptyChat.remove();
    const row=document.createElement("div");
    row.className="msg "+(role==="user"?"user":"orbit");
    const bubble=document.createElement("div");
    bubble.className="bubble"+(isError?" error-bubble":"");
    bubble.textContent=text;
    if(role!=="user"&&!isError){
        const btn=document.createElement("button");
        btn.className="copy-btn";btn.textContent="📋 Copiar";
        btn.onclick=()=>{navigator.clipboard.writeText(text);btn.textContent="Copiado!";setTimeout(()=>btn.textContent="📋 Copiar",1800);};
        bubble.appendChild(btn);
    }
    row.appendChild(bubble);messagesEl.appendChild(row);messagesEl.scrollTop=messagesEl.scrollHeight;
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
    conversations.unshift({id:conversationCounter,title:conversationTitle});
    renderHistory();
}

/* ===== PARTE 5: BARRA LATERAL / HISTÓRICO ===== */
function renderHistory(){
    historyList.innerHTML="";
    if(conversations.length===0){historyList.appendChild(historyEmpty);return;}
    conversations.forEach(conv=>{
        const btn=document.createElement("button");
        btn.className="history-item"+(conv.title===conversationTitle?" active":"");
        btn.textContent=conv.title;
        btn.onclick=()=>showView("chat");
        historyList.appendChild(btn);
    });
}
function startNewChat(){
    if(busy) return;
    conversationTitle="";
    chatTitle.textContent="NOVA CONVERSA";
    messagesEl.innerHTML=`<div id="emptyChat" class="empty-chat">
      <div class="mini-orbit"><div class="blob-wrap"><div class="blob"></div><div class="blob b2"></div><div class="blob core"></div></div></div>
      <p>Envie uma mensagem para começar a conversar com o Orbit.</p></div>`;
    chatAskInput.value="";
    renderHistory();
    showView("chat");
}
sidebarNewChat.addEventListener("click",startNewChat);

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
homeAskBar.addEventListener("submit",e=>{e.preventDefault();const v=homeAskInput.value;homeAskInput.value="";if(v)sendMessage(v);});
chatAskBar.addEventListener("submit",e=>{e.preventDefault();const v=chatAskInput.value;chatAskInput.value="";if(v)sendMessage(v);});
document.querySelectorAll(".pill").forEach(p=>p.addEventListener("click",()=>{showView("chat");sendMessage(p.dataset.q);}));

/* ===== PARTE 3: ATALHOS DE TECLADO ===== */
window.addEventListener("keydown",e=>{
    const alvo=document.activeElement;
    if(e.key==="Enter"&&!e.shiftKey&&(alvo===chatAskInput||alvo===homeAskInput)){
        e.preventDefault();
        (alvo===chatAskInput?chatAskBar:homeAskBar).requestSubmit();
    }
    if(e.ctrlKey&&e.key.toLowerCase()==="n"){e.preventDefault();startNewChat();}
    if(e.ctrlKey&&e.key.toLowerCase()==="l"){
        e.preventDefault();
        if(currentView==="chat"){chatAskInput.value="";chatAskInput.focus();}
        else{homeAskInput.value="";homeAskInput.focus();}
    }
});

/* ===== inicialização ===== */
document.addEventListener("DOMContentLoaded",()=>{initTheme();setState("idle");renderHistory();});