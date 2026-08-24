package org.example.chatdesktop.bridge;

import com.google.gson.Gson;
import javafx.application.Platform;
import javafx.scene.web.WebEngine;
import org.example.chatdesktop.model.ChatMessage;
import org.example.chatdesktop.service.GroqService;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletionException;

public class JSBridge {

    private final WebEngine webEngine;

    private final GroqService groqService;

    private final Gson gson = new Gson();

    private final List<ChatMessage> historico =
            new ArrayList<>();

    private long conversationId = 0;


    private static final String SYSTEM_PROMPT =
            """
            Você é o Orbit, um assistente de inteligência artificial.

            Responda sempre em português do Brasil.

            Seja claro, útil, profissional e objetivo.

            Você pode ajudar com programação, tecnologia,
            estudos, dúvidas, explicações e assuntos gerais.

            Quando o usuário pedir código, forneça código
            funcional e explique somente o necessário.

            Não invente informações.
            """;


    public JSBridge(WebEngine webEngine) {

        this.webEngine = webEngine;

        System.out.println(
                "Inicializando GroqService..."
        );

        this.groqService =
                new GroqService();

        resetHistorico();

        System.out.println(
                "JSBridge inicializado."
        );
    }


    /**
     * Chamado pelo botão "Nova conversa".
     */
    public synchronized void newChat() {

        System.out.println(
                "Iniciando nova conversa."
        );

        conversationId++;

        resetHistorico();
    }


    /**
     * Chamado pelo JavaScript:
     *
     * window.javaBridge.sendMessage(texto)
     */
    public void sendMessage(String texto) {

        System.out.println(
                "Mensagem recebida pelo Java: "
                        + texto
        );


        if (
                texto == null ||
                        texto.isBlank()
        ) {

            System.out.println(
                    "Mensagem vazia."
            );

            return;
        }


        final List<ChatMessage> copiaHistorico;

        final long requestConversationId;


        synchronized (this) {

            historico.add(
                    new ChatMessage(
                            "user",
                            texto.trim()
                    )
            );


            copiaHistorico =
                    new ArrayList<>(
                            historico
                    );


            requestConversationId =
                    conversationId;
        }


        System.out.println(
                "Enviando mensagem para a Groq..."
        );


        groqService
                .enviarMensagem(
                        copiaHistorico
                )
                .thenAccept(resposta -> {

                    System.out.println(
                            "Resposta recebida da Groq:"
                    );

                    System.out.println(
                            resposta
                    );


                    onSucesso(
                            requestConversationId,
                            resposta
                    );

                })
                .exceptionally(erro -> {

                    System.err.println(
                            "ERRO AO CONSULTAR GROQ:"
                    );

                    erro.printStackTrace();


                    onErro(
                            requestConversationId,
                            erro
                    );


                    return null;
                });
    }


    private void onSucesso(
            long requestConversationId,
            String resposta
    ) {

        synchronized (this) {

            /*
             * Ignora respostas de uma conversa
             * antiga que já foi substituída.
             */
            if (
                    requestConversationId !=
                            conversationId
            ) {

                return;
            }


            historico.add(
                    new ChatMessage(
                            "assistant",
                            resposta
                    )
            );
        }


        String script =
                "window.orbitReceive("
                        + gson.toJson(resposta)
                        + ");";


        executarJavaScript(script);
    }


    private void onErro(
            long requestConversationId,
            Throwable erro
    ) {

        synchronized (this) {

            if (
                    requestConversationId !=
                            conversationId
            ) {

                return;
            }
        }


        Throwable causa = erro;


        if (
                causa instanceof CompletionException &&
                        causa.getCause() != null
        ) {

            causa =
                    causa.getCause();
        }


        String mensagem =
                causa.getMessage();


        if (
                mensagem == null ||
                        mensagem.isBlank()
        ) {

            mensagem =
                    "Não foi possível obter uma resposta da IA.";
        }


        String script =
                "window.orbitError("
                        + gson.toJson(mensagem)
                        + ");";


        executarJavaScript(script);
    }


    private void executarJavaScript(
            String script
    ) {

        Platform.runLater(() -> {

            try {

                webEngine.executeScript(
                        script
                );

            } catch (Exception e) {

                System.err.println(
                        "Erro ao executar JavaScript:"
                );

                e.printStackTrace();
            }
        });
    }


    private synchronized void resetHistorico() {

        historico.clear();


        historico.add(
                new ChatMessage(
                        "system",
                        SYSTEM_PROMPT
                )
        );
    }
}