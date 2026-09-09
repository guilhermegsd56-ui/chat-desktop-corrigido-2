package org.example.chatdesktop.model;

import java.util.ArrayList;
import java.util.List;

public class ChatMessage {

    private final String role;
    private final String content;
    private final String origin;
    private final List<String> sources;
    private final boolean isError;

    // ===== CONSTRUTOR SIMPLES (compatibilidade) =====
    public ChatMessage(String role, String content) {
        this(role, content, "unknown", new ArrayList<>(), false);
    }

    // ===== CONSTRUTOR COMPLETO =====
    public ChatMessage(
            String role,
            String content,
            String origin,
            List<String> sources,
            boolean isError
    ) {
        this.role = role;
        this.content = content;
        this.origin = origin != null ? origin : "unknown";
        this.sources = sources != null ? sources : new ArrayList<>();
        this.isError = isError;
    }

    // ===== GETTERS =====
    public String getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }

    public String getOrigin() {
        return origin;
    }

    public List<String> getSources() {
        return sources;
    }

    public boolean isError() {
        return isError;
    }

    // ===== BUILDER (opcional, mas útil) =====
    public static class Builder {
        private String role;
        private String content;
        private String origin = "unknown";
        private List<String> sources = new ArrayList<>();
        private boolean isError = false;

        public Builder role(String role) {
            this.role = role;
            return this;
        }

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

        public Builder isError(boolean isError) {
            this.isError = isError;
            return this;
        }

        public ChatMessage build() {
            return new ChatMessage(role, content, origin, sources, isError);
        }
    }
}