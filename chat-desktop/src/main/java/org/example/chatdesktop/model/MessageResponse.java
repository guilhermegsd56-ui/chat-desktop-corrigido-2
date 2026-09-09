package org.example.chatdesktop.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Encapsula a resposta do Orbit com todos os metadados.
 *
 * Fluxo:
 * JSBridge.ask() → RagService.buscarContexto() + GroqService.chat()
 *                → MessageResponse com origem + fontes
 *                → JSON para o JavaScript
 */
public class MessageResponse {

    private String content;
    private String origin; // "rag", "fallback", "error"
    private List<String> sources; // ["funcionarios.txt", "documento.pdf"]
    private boolean success;
    private String errorMessage;

    // ===== CONSTRUTOR =====
    public MessageResponse(
            String content,
            String origin,
            List<String> sources,
            boolean success,
            String errorMessage
    ) {
        this.content = content;
        this.origin = origin;
        this.sources = sources != null ? sources : new ArrayList<>();
        this.success = success;
        this.errorMessage = errorMessage;
    }

    // ===== BUILDER =====
    public static class Builder {
        private String content = "";
        private String origin = "unknown";
        private List<String> sources = new ArrayList<>();
        private boolean success = true;
        private String errorMessage = null;

        public Builder content(String content) {
            this.content = content;
            return this;
        }

        public Builder origin(String origin) {
            this.origin = origin;
            return this;
        }

        public Builder sources(List<String> sources) {
            this.sources = sources;
            return this;
        }

        public Builder addSource(String source) {
            this.sources.add(source);
            return this;
        }

        public Builder success(boolean success) {
            this.success = success;
            return this;
        }

        public Builder errorMessage(String msg) {
            this.errorMessage = msg;
            return this;
        }

        public MessageResponse build() {
            return new MessageResponse(
                    content,
                    origin,
                    sources,
                    success,
                    errorMessage
            );
        }
    }

    // ===== GETTERS =====
    public String getContent() {
        return content;
    }

    public String getOrigin() {
        return origin;
    }

    public List<String> getSources() {
        return sources;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    // ===== SETTERS =====
    public void setContent(String content) {
        this.content = content;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public void setSources(List<String> sources) {
        this.sources = sources;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
}