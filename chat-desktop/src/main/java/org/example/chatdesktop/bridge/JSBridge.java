package org.example.chatdesktop.bridge;

import com.google.gson.Gson;
import javafx.application.Platform;
import javafx.scene.web.WebEngine;
import org.example.chatdesktop.model.ChatMessage;
import org.example.chatdesktop.service.GroqService;

import java.util.ArrayList;
import java.util.List;

/**
 * Objeto exposto ao JavaScript da WebView como "window.javaBridge".
 * O front-end (script.js) chama sendMessage(texto) e essa classe:
 *   1) guarda o histórico da conversa,
 *   2) chama o GroqService (que efetivamente fala com a API da Groq),
 *   3) devolve a resposta para o JS através de window.orbitReceive(...)
 *      ou window.orbitError(...), sempre na Application Thread do JavaFX.
 */
public class JSBridge {

    private final WebEngine webEngine;
    private final GroqService groqService;
    private final List<ChatMessage> historico;
    private final Gson gson = new Gson();

    private static final String SYSTEM_PROMPT =
            "Você é Orbit, um assistente de IA conversacional. Responda sempre em "
                    + "português do Brasil, de forma clara, direta e acolhedora. Seja útil "
                    + "e objetivo, evitando respostas excessivamente longas quando uma "
                    + "resposta curta resolve.";

    public JSBridge(WebEngine webEngine) {
        this.webEngine = webEngine;
        this.groqService = new GroqService();
        this.historico = new ArrayList<>();

        historico.add(new ChatMessage("system", SYSTEM_PROMPT));
    }

    /**
     * Chamado pelo JavaScript: window.javaBridge.newChat().
     * Descarta todo o histórico da conversa atual (menos o prompt de sistema)
     * para que a próxima mensagem enviada comece um contexto novo, sem
     * nenhuma memória da conversa anterior.
     */
    public void newChat() {
        historico.clear();
        historico.add(new ChatMessage("system", SYSTEM_PROMPT));
    }

    /**
     * Chamado diretamente pelo JavaScript: window.javaBridge.sendMessage(texto)
     */
    public void sendMessage(String texto) {

        if (texto == null || texto.isBlank()) {
            return;
        }

        historico.add(new ChatMessage("user", texto));

        groqService.enviarMensagem(historico)
                .thenAccept(this::onSucesso)
                .exceptionally(this::onErro);
    }

    private void onSucesso(String resposta) {

        historico.add(new ChatMessage("assistant", resposta));

        Platform.runLater(() ->
                webEngine.executeScript(
                        "window.orbitReceive(" + gson.toJson(resposta) + ")"
                )
        );
    }

    private Void onErro(Throwable erro) {

        Throwable causa = erro.getCause() != null ? erro.getCause() : erro;
        String mensagem = causa.getMessage() != null
                ? causa.getMessage()
                : "Falha desconhecida ao falar com a Groq.";

        Platform.runLater(() ->
                webEngine.executeScript(
                        "window.orbitError(" + gson.toJson(mensagem) + ")"
                )
        );

        return null;
    }
}