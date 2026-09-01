package org.example.chatdesktop.service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class RagService {

    private static final String ARQUIVO =
            "/org/example/chatdesktop/knowledge/cerebro.txt";

    private static final String NOME_ARQUIVO = "cerebro.txt";

    public String getNomeArquivo() {
        return NOME_ARQUIVO;
    }

    public String buscarContexto(String pergunta) {

        String documento = carregarDocumento();

        if (documento == null || documento.isBlank()) {
            return "";
        }

        Set<String> palavrasPergunta = extrairPalavras(pergunta);

        return Arrays.stream(documento.split("\\R"))
                .map(String::trim)
                .filter(linha -> !linha.isBlank())
                .filter(linha -> extrairPalavras(linha).stream()
                        .anyMatch(palavrasPergunta::contains))
                .collect(Collectors.joining("\n"));
    }

    private String carregarDocumento() {

        try (InputStream inputStream =
                     RagService.class.getResourceAsStream(ARQUIVO)) {

            if (inputStream == null) {
                System.err.println(
                        "⚠️ Arquivo RAG não encontrado: " + ARQUIVO
                );
                return "";
            }

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(
                            inputStream,
                            StandardCharsets.UTF_8
                    )
            )) {

                String documento = reader.lines()
                        .collect(Collectors.joining("\n"));

                System.out.println(
                        "✅ RAG carregado: " + NOME_ARQUIVO
                );

                return documento;
            }

        } catch (Exception e) {

            System.err.println(
                    "❌ Erro ao carregar documento RAG: "
                            + e.getMessage()
            );

            return "";
        }
    }

    private Set<String> extrairPalavras(String texto) {

        if (texto == null || texto.isBlank()) {
            return new HashSet<>();
        }

        return Arrays.stream(
                        texto
                                .toLowerCase()
                                .replaceAll(
                                        "[^\\p{L}\\p{N}]+",
                                        " "
                                )
                                .trim()
                                .split("\\s+")
                )
                .filter(palavra -> !palavra.isBlank())
                .collect(Collectors.toSet());
    }
}