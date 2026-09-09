package org.example.chatdesktop.service;

import org.example.chatdesktop.model.DocumentChunk;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Armazenamento em memória de chunks e embeddings
 *
 * Futuramente: será substituído por um banco vetorial real
 * (Pinecone, Weaviate, Milvus, etc)
 */
public class VectorStore {

    private final Map<String, DocumentChunk> chunks;
    private final Map<String, String> embeddings;

    public VectorStore() {
        this.chunks = new HashMap<>();
        this.embeddings = new HashMap<>();
    }

    /**
     * Salva um chunk e seu embedding
     */
    public void salvar(DocumentChunk chunk, String embedding) {
        chunks.put(chunk.getId(), chunk);
        embeddings.put(chunk.getId(), embedding);
    }

    /**
     * Busca chunks semelhantes
     *
     * NOTA: Esta é uma busca simplificada baseada em hash.
     * Em produção, seria uma busca vetorial real com cálculo de similaridade.
     */
    public List<DocumentChunk> buscar(String embedding, int topK) {

        if (chunks.isEmpty()) {
            return new ArrayList<>();
        }

        // Implementação simplificada: retorna os primeiros topK chunks
        // Mais tarde, será substituído por busca vetorial real
        return chunks.values()
                .stream()
                .limit(topK)
                .collect(Collectors.toList());
    }

    /**
     * Remove um chunk
     */
    public void deletar(String chunkId) {
        chunks.remove(chunkId);
        embeddings.remove(chunkId);
    }

    /**
     * Limpa todo o armazenamento
     */
    public void limpar() {
        chunks.clear();
        embeddings.clear();
    }

    /**
     * Retorna o número de chunks armazenados
     */
    public int tamanho() {
        return chunks.size();
    }
}