package org.example.chatdesktop.config;

public class GroqConfig {

    // URL oficial da API da Groq (compatível com OpenAI)
    public static final String API_URL = "https://api.groq.com/openai/v1/chat/completions";

    // llama-3.3-70b-versatile foi DESATIVADO pela Groq em 16/08/2026.
    // Modelo recomendado pela própria Groq como substituto: openai/gpt-oss-120b
    public static final String MODEL = "openai/gpt-oss-120b";

    public static String getApiKey() {
        String apiKey = System.getenv("GROQ_API_KEY");

        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = "SUA_CHAVE_DA_GROQ_AQUI";
        }

        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("SUA_CHAVE_DA_GROQ_AQUI")) {
            throw new IllegalStateException("A chave da API Groq não foi configurada corretamente.");
        }

        return apiKey;
    }
}