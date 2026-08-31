package org.example.chatdesktop.bridge;

import javafx.application.Platform;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
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
                        engine.executeScript(
                                "window.orbitReceive(" +
                                        escapeJavaStyleString(resposta) +
                                        ")"
                        )
                );

            } catch (Exception e) {

                String erroMsg =
                        e.getMessage() != null
                                ? e.getMessage()
                                : "Erro desconhecido";

                Platform.runLater(() ->
                        engine.executeScript(
                                "window.orbitError(" +
                                        escapeJavaStyleString(erroMsg) +
                                        ")"
                        )
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
                engine.executeScript(
                        "applyTheme('" + theme + "')"
                )
        );
    }

    /**
     * Copia o texto para a área de transferência
     * do sistema operacional usando a Clipboard
     * nativa do JavaFX.
     *
     * Isso evita depender do navigator.clipboard
     * dentro do WebView.
     */
    public void copyToClipboard(String text) {

        final Clipboard clipboard =
                Clipboard.getSystemClipboard();

        final ClipboardContent content =
                new ClipboardContent();

        content.putString(
                text != null
                        ? text
                        : ""
        );

        clipboard.setContent(content);
    }

    /**
     * Obtém o texto da área de transferência
     * do sistema operacional.
     *
     * O método é chamado diretamente pelo JavaScript:
     *
     * window.orbitBridge.pasteFromClipboard()
     */
    public String pasteFromClipboard() {

        final Clipboard clipboard =
                Clipboard.getSystemClipboard();

        if (clipboard.hasString()) {

            String texto =
                    clipboard.getString();

            return texto != null
                    ? texto
                    : "";
        }

        return "";
    }

    private String escapeJavaStyleString(String str) {

        if (str == null) {
            return "\"\"";
        }

        return "\"" +
                str.replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")
                        .replace("\r", "") +
                "\"";
    }
}