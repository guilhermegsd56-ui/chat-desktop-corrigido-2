package org.example.chatdesktop.model;

/**
 * Representa um pedaço (chunk) de um documento
 * após a divisão em fragmentos menores.
 */
public class DocumentChunk {

    private final String id;
    private final String nomeDocumento;
    private final String conteudo;
    private final int posicaoInicio;
    private final int posicaoFim;

    public DocumentChunk(
            String id,
            String nomeDocumento,
            String conteudo,
            int posicaoInicio,
            int posicaoFim
    ) {
        this.id = id;
        this.nomeDocumento = nomeDocumento;
        this.conteudo = conteudo;
        this.posicaoInicio = posicaoInicio;
        this.posicaoFim = posicaoFim;
    }

    public String getId() {
        return id;
    }

    public String getNomeDocumento() {
        return nomeDocumento;
    }

    public String getConteudo() {
        return conteudo;
    }

    public int getPosicaoInicio() {
        return posicaoInicio;
    }

    public int getPosicaoFim() {
        return posicaoFim;
    }
}