package org.example.chatdesktop.service;

/**
 * Serviço de geração de embeddings
 *
 * Por enquanto: implementação simples com hash
 * Futuramente: integrar com Groq, OpenAI, ou outro provedor
 */
public class EmbeddingService {

    /**
     * Gera um embedding para um texto
     *
     * NOTA: Esta é uma implementação simplificada.
     * Em produção, você integraria com um serviço real
     * (Groq, OpenAI, Hugging Face, etc)
     */
    public String gerarEmbedding(String texto) {

        if (texto == null || texto.isBlank()) {
            return "";
        }

        // Implementação simples: hash do texto
        // Mais tarde, será substituído por um serviço real
        return String.valueOf(texto.hashCode());
    }
}