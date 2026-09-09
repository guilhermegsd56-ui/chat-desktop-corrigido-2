package org.example.chatdesktop.service;

import org.example.chatdesktop.model.DocumentChunk;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * Serviço de Retrieval-Augmented Generation (RAG)
 *
 * Responsabilidades:
 * - Carregar documentos da base de conhecimento
 * - Buscar contexto relevante para uma pergunta
 * - Rastrear quais fontes foram utilizadas
 */
public class RagService {

    // Caminho dentro do classpath (funciona tanto rodando via Maven
    // quanto empacotado em .jar)
    private static final String KNOWLEDGE_CLASSPATH =
            "/org/example/chatdesktop/knowledge";

    private final EmbeddingService embeddingService;
    private final VectorStore vectorStore;
    private List<String> ultimasFontesUsadas;

    public RagService() {
        this.embeddingService = new EmbeddingService();
        this.vectorStore = new VectorStore();
        this.ultimasFontesUsadas = new ArrayList<>();

        // Carrega os documentos na inicialização
        carregarDocumentos();
    }

    /**
     * Carrega todos os documentos da base de conhecimento,
     * lendo pelo CLASSPATH em vez de caminho relativo em disco.
     *
     * Isso funciona tanto executando via "mvn javafx:run" quanto
     * a partir de um .jar empacotado — diferente de antes, que só
     * funcionava (por acaso) se existisse uma pasta física chamada
     * "resources/knowledge" ao lado do diretório de execução.
     */
    private void carregarDocumentos() {

        try {

            URL dirUrl = getClass().getResource(KNOWLEDGE_CLASSPATH);

            if (dirUrl == null) {
                System.out.println(
                        "[RAG] Base de conhecimento não encontrada no classpath: "
                                + KNOWLEDGE_CLASSPATH
                );
                return;
            }

            if ("file".equals(dirUrl.getProtocol())) {

                // Rodando via Maven / IDE: os resources existem como
                // arquivos reais no disco (target/classes/...)
                Path basePath = Paths.get(dirUrl.toURI());
                carregarDeDiretorio(basePath);

            } else if ("jar".equals(dirUrl.getProtocol())) {

                // Rodando a partir de um .jar empacotado
                carregarDeJar(dirUrl);

            } else {

                System.err.println(
                        "[RAG] Protocolo de recurso não suportado: "
                                + dirUrl.getProtocol()
                );
            }

        } catch (URISyntaxException | IOException e) {
            System.err.println("[RAG] Erro ao acessar base de conhecimento: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void carregarDeDiretorio(Path basePath) throws IOException {

        // try-with-resources: garante que o stream do diretório
        // seja fechado mesmo se ocorrer erro no meio do processamento.
        // Files.list() abre um recurso de sistema (DirectoryStream)
        // que, se não for fechado, vaza a cada chamada.
        try (Stream<Path> arquivos = Files.list(basePath)) {

            arquivos
                    .filter(Files::isRegularFile)
                    .forEach(arquivo -> {
                        try {
                            carregarDocumento(
                                    arquivo.getFileName().toString(),
                                    Files.readString(arquivo, StandardCharsets.UTF_8)
                            );
                        } catch (IOException e) {
                            System.err.println(
                                    "[RAG] Erro ao carregar " + arquivo + ": " + e.getMessage()
                            );
                        }
                    });
        }
    }

    private void carregarDeJar(URL dirUrl) throws IOException {

        String jarPath = dirUrl.getPath().substring(5, dirUrl.getPath().indexOf("!"));

        try (java.util.jar.JarFile jar =
                     new java.util.jar.JarFile(URLDecoder(jarPath))) {

            java.util.Enumeration<java.util.jar.JarEntry> entries = jar.entries();

            while (entries.hasMoreElements()) {

                java.util.jar.JarEntry entry = entries.nextElement();

                if (entry.isDirectory()
                        || !entry.getName().startsWith(KNOWLEDGE_CLASSPATH.substring(1))) {
                    continue;
                }

                String nomeArquivo =
                        entry.getName().substring(entry.getName().lastIndexOf('/') + 1);

                if (nomeArquivo.isBlank()) {
                    continue;
                }

                try (InputStream is = jar.getInputStream(entry)) {

                    String conteudo = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    carregarDocumento(nomeArquivo, conteudo);
                }
            }
        }
    }

    private static String URLDecoder(String path) {
        return java.net.URLDecoder.decode(path, StandardCharsets.UTF_8);
    }

    /**
     * Processa o conteúdo já lido de um documento (chunking + embeddings)
     */
    private void carregarDocumento(String nomeArquivo, String conteudo) {

        if (conteudo == null || conteudo.isBlank()) {
            System.out.println("[RAG] Arquivo vazio: " + nomeArquivo);
            return;
        }

        List<DocumentChunk> chunks = dividirEmChunks(conteudo, nomeArquivo);

        for (DocumentChunk chunk : chunks) {
            String embedding = embeddingService.gerarEmbedding(chunk.getConteudo());
            vectorStore.salvar(chunk, embedding);
        }

        System.out.println(
                "[RAG] Documento carregado: " + nomeArquivo + " (" + chunks.size() + " chunks)"
        );
    }

    /**
     * Divide um documento em chunks menores
     *
     * Configurações:
     * - Tamanho do chunk: 500-1000 tokens (aproximadamente 2000-4000 caracteres)
     * - Sobreposição: 50-150 tokens (200-600 caracteres)
     */
    private List<DocumentChunk> dividirEmChunks(String conteudo, String nomeArquivo) {

        List<DocumentChunk> chunks = new ArrayList<>();

        final int CHUNK_SIZE = 2000;
        final int OVERLAP = 300;

        int chunkId = 0;
        int inicio = 0;

        while (inicio < conteudo.length()) {

            int fim = Math.min(inicio + CHUNK_SIZE, conteudo.length());
            String chunkConteudo = conteudo.substring(inicio, fim);

            DocumentChunk chunk = new DocumentChunk(
                    "chunk_" + nomeArquivo + "_" + chunkId,
                    nomeArquivo,
                    chunkConteudo,
                    inicio,
                    fim
            );

            chunks.add(chunk);

            // Proteção extra: evita loop infinito caso OVERLAP >= CHUNK_SIZE
            // por engano numa mudança futura de configuração
            int proximoInicio = fim - OVERLAP;
            if (proximoInicio <= inicio) {
                proximoInicio = fim;
            }
            inicio = proximoInicio;

            chunkId++;
        }

        return chunks;
    }

    /**
     * Busca contexto relevante para uma pergunta
     */
    public String buscarContexto(String pergunta) {

        ultimasFontesUsadas.clear();

        if (pergunta == null || pergunta.isBlank()) {
            return "";
        }

        try {

            String embeddingPergunta = embeddingService.gerarEmbedding(pergunta);

            List<DocumentChunk> chunksRelevantes = vectorStore.buscar(
                    embeddingPergunta,
                    5
            );

            if (chunksRelevantes.isEmpty()) {
                return "";
            }

            java.util.Set<String> fontesSet = new java.util.LinkedHashSet<>();
            StringBuilder contexto = new StringBuilder();

            for (DocumentChunk chunk : chunksRelevantes) {

                fontesSet.add(chunk.getNomeDocumento());

                contexto.append("--- Fonte: ")
                        .append(chunk.getNomeDocumento())
                        .append(" ---\n")
                        .append(chunk.getConteudo())
                        .append("\n\n");
            }

            ultimasFontesUsadas.addAll(fontesSet);

            return contexto.toString();

        } catch (Exception e) {
            System.err.println("[RAG] Erro ao buscar contexto: " + e.getMessage());
            e.printStackTrace();
            return "";
        }
    }

    public List<String> obterFontesUsadas() {
        return new ArrayList<>(ultimasFontesUsadas);
    }

    public void limpar() {
        vectorStore.limpar();
        ultimasFontesUsadas.clear();
    }
}