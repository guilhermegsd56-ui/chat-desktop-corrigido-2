package org.example.chatdesktop.bridge;

import javafx.application.Platform;
import javafx.scene.web.WebEngine;
import org.example.chatdesktop.service.GroqService;

public class JSBridge {

    private final WebEngine engine;
    private final GroqService groqService;

    public JSBridge(WebEngine engine) {
        this.engine = engine;
        this.groqService = new GroqService();
    }

    public void ask(String prompt) {
        new Thread(() -> {
            try {
                String resposta = groqService.chat(prompt);
                Platform.runLater(() ->
                        engine.executeScript("window.orbitReceive(" + escapeJavaStyleString(resposta) + ")")
                );
            } catch (Exception e) {
                String erroMsg = e.getMessage() != null ? e.getMessage() : "Erro desconhecido";
                Platform.runLater(() ->
                        engine.executeScript("window.orbitError(" + escapeJavaStyleString(erroMsg) + ")")
                );
            }
        }).start();
    }

    public void newConversation() {
        Platform.runLater(() -> {
            // Lógica interna do Java se necessário ao criar nova conversa
        });
    }

    public void newChat() {
        newConversation();
    }

    public void clearInput() {
        Platform.runLater(() -> {
            // Lógica para limpar campos
        });
    }

    public void changeTheme(String theme) {
        Platform.runLater(() ->
                engine.executeScript("applyTheme('" + theme + "')")
        );
    }

    private String escapeJavaStyleString(String str) {
        if (str == null) return "\"\"";
        return "\"" + str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "") + "\"";
    }
}