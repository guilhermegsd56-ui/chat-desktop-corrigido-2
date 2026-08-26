package org.example.chatdesktop.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.example.chatdesktop.config.GroqConfig;

import java.io.IOException;
import java.net.ConnectException;
import java.net.URI;
import java.net.UnknownHostException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;

public class GroqService {

    private final String apiKey;
    private final HttpClient httpClient;
    private final Gson gson;

    public GroqService() {
        String key;
        try {
            key = GroqConfig.getApiKey();
        } catch (IllegalStateException e) {
            key = null;
        }
        apiKey = key;

        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        gson = new Gson();
    }

    public String chat(String pergunta) throws Exception {
        if (pergunta == null || pergunta.trim().isEmpty()) {
            return "Digite uma pergunta para o Orbit.";
        }

        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IOException("A chave da API não foi configurada.");
        }

        JsonObject body = new JsonObject();
        body.addProperty("model", GroqConfig.MODEL);
        body.addProperty("temperature", 0.7);
        body.addProperty("max_tokens", 2048);

        JsonArray messages = new JsonArray();

        JsonObject system = new JsonObject();
        system.addProperty("role", "system");
        system.addProperty(
                "content",
                "Você é o Orbit, uma inteligência artificial profissional. " +
                        "Responda em português do Brasil, de forma clara, objetiva e útil."
        );
        messages.add(system);

        JsonObject user = new JsonObject();
        user.addProperty("role", "user");
        user.addProperty("content", pergunta.trim());
        messages.add(user);

        body.add("messages", messages);

        String json = gson.toJson(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GroqConfig.API_URL))
                .timeout(Duration.ofSeconds(60))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response;

        // ===== PARTE 1: TRATAMENTO DE ERROS DE REDE =====
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (ConnectException | UnknownHostException e) {
            throw new IOException("Sem conexão com a internet. Verifique sua rede e tente novamente.");
        } catch (HttpTimeoutException e) {
            throw new IOException("A requisição demorou demais para responder. Tente novamente.");
        } catch (IOException e) {
            throw new IOException("Falha na comunicação com o servidor da Groq. Tente novamente.");
        }

        int status = response.statusCode();

        if (status == 200) {
            return extrairResposta(response.body());
        }

        if (status == 401) {
            throw new IOException("A chave da Groq é inválida ou expirou.");
        }

        if (status == 429) {
            throw new IOException("Limite da API atingido. Tente novamente.");
        }

        if (status == 403) {
            throw new IOException("A API recusou o acesso.");
        }

        if (status >= 500) {
            throw new IOException("O servidor da Groq está indisponível.");
        }

        throw new IOException("Erro da API. Código HTTP: " + status);
    }

    private String extrairResposta(String json) {
        try {
            JsonObject root = JsonParser.parseString(json).getAsJsonObject();
            JsonArray choices = root.getAsJsonArray("choices");

            if (choices == null || choices.isEmpty()) {
                return "A IA não retornou resposta.";
            }

            JsonObject choice = choices.get(0).getAsJsonObject();
            JsonObject message = choice.getAsJsonObject("message");

            if (message == null || !message.has("content")) {
                return "A IA não retornou conteúdo.";
            }

            return message.get("content").getAsString();

        } catch (Exception e) {
            e.printStackTrace();
            return "Erro ao interpretar a resposta da IA.";
        }
    }
}