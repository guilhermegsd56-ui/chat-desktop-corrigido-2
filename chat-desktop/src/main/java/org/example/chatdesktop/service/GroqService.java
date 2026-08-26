package org.example.chatdesktop;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class GroqService {

    /*
     * NÃO coloque uma chave real no GitHub.
     *
     * O ideal é criar uma variável de ambiente:
     *
     * GROQ_API_KEY = sua_chave
     *
     * Caso queira testar localmente rapidamente,
     * você pode colocar a chave diretamente abaixo.
     */
    private static final String API_KEY = System.getenv("GROQ_API_KEY");

    private static final String API_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    /*
     * Modelo utilizado pela API da Groq.
     */
    private static final String MODEL =
            "llama-3.3-70b-versatile";

    private final HttpClient httpClient;

    public GroqService() {
        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    public String chat(String mensagem) {

        if (mensagem == null || mensagem.isBlank()) {
            return "Digite uma pergunta antes de enviar.";
        }

        if (API_KEY == null || API_KEY.isBlank()) {
            return "Erro: a chave da Groq não foi configurada.";
        }

        try {

            JsonObject body = new JsonObject();

            body.addProperty("model", MODEL);

            JsonArray messages = new JsonArray();

            JsonObject systemMessage = new JsonObject();
            systemMessage.addProperty(
                    "role",
                    "system"
            );
            systemMessage.addProperty(
                    "content",
                    """
                    Você é o Orbit AI, um assistente inteligente,
                    profissional, claro e objetivo.

                    Responda sempre em português do Brasil.

                    Explique os assuntos de forma simples quando
                    necessário e mantenha respostas organizadas.
                    """
            );

            JsonObject userMessage = new JsonObject();
            userMessage.addProperty(
                    "role",
                    "user"
            );
            userMessage.addProperty(
                    "content",
                    mensagem
            );

            messages.add(systemMessage);
            messages.add(userMessage);

            body.add("messages", messages);

            body.addProperty(
                    "temperature",
                    0.7
            );

            body.addProperty(
                    "max_tokens",
                    2048
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .timeout(Duration.ofSeconds(60))
                    .header(
                            "Content-Type",
                            "application/json"
                    )
                    .header(
                            "Authorization",
                            "Bearer " + API_KEY
                    )
                    .POST(
                            HttpRequest.BodyPublishers.ofString(
                                    body.toString()
                            )
                    )
                    .build();

            HttpResponse<String> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers.ofString()
                    );

            int status = response.statusCode();

            if (status == 200) {
                return extrairResposta(response.body());
            }

            if (status == 401) {
                return "Erro: a chave da API da Groq é inválida ou expirou.";
            }

            if (status == 429) {
                return "Limite da API atingido. Aguarde alguns segundos e tente novamente.";
            }

            if (status == 400) {
                return "A solicitação enviada para a IA é inválida.";
            }

            if (status == 403) {
                return "A API recusou o acesso. Verifique sua chave e permissões.";
            }

            if (status >= 500) {
                return "A Groq está apresentando uma falha temporária. Tente novamente.";
            }

            return "Erro na comunicação com a IA. Código: " + status;

        } catch (IOException e) {

            return "Sem conexão com a internet. Verifique sua conexão e tente novamente.";

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();

            return "A comunicação com a IA foi interrompida.";

        } catch (Exception e) {

            return "Ocorreu um erro inesperado ao conversar com o Orbit.";
        }
    }

    private String extrairResposta(String json) {

        try {

            JsonObject resposta =
                    JsonParser.parseString(json)
                            .getAsJsonObject();

            JsonArray choices =
                    resposta.getAsJsonArray("choices");

            if (choices == null || choices.isEmpty()) {
                return "A IA não retornou nenhuma resposta.";
            }

            JsonObject primeiraEscolha =
                    choices.get(0).getAsJsonObject();

            JsonObject message =
                    primeiraEscolha
                            .getAsJsonObject("message");

            if (message == null) {
                return "A IA retornou uma resposta inválida.";
            }

            if (!message.has("content")) {
                return "A IA não retornou conteúdo.";
            }

            return message
                    .get("content")
                    .getAsString()
                    .trim();

        } catch (Exception e) {

            return "Não foi possível interpretar a resposta da IA.";
        }
    }
}