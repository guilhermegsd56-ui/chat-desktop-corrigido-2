package org.example.chatdesktop.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.example.chatdesktop.config.GroqConfig;
import org.example.chatdesktop.model.ChatMessage;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class GroqService {

    private final HttpClient httpClient;
    private final Gson gson;
    private final String apiKey;

    public GroqService() {
        this.apiKey = GroqConfig.getApiKey();
        this.httpClient = HttpClient.newHttpClient();
        this.gson = new Gson();
    }

    public CompletableFuture<String> enviarMensagem(
            List<ChatMessage> historico
    ) {

        JsonObject body = new JsonObject();

        body.addProperty(
                "model",
                GroqConfig.MODEL
        );

        body.addProperty(
                "stream",
                false
        );

        JsonArray messages = new JsonArray();

        for (ChatMessage message : historico) {

            JsonObject item = new JsonObject();

            item.addProperty(
                    "role",
                    message.getRole()
            );

            item.addProperty(
                    "content",
                    message.getContent()
            );

            messages.add(item);
        }

        body.add(
                "messages",
                messages
        );

        HttpRequest request =
                HttpRequest.newBuilder()
                        .uri(
                                URI.create(
                                        GroqConfig.API_URL
                                )
                        )
                        .header(
                                "Content-Type",
                                "application/json"
                        )
                        .header(
                                "Authorization",
                                "Bearer " + apiKey
                        )
                        .POST(
                                HttpRequest.BodyPublishers.ofString(
                                        gson.toJson(body)
                                )
                        )
                        .build();

        return httpClient
                .sendAsync(
                        request,
                        HttpResponse.BodyHandlers.ofString()
                )
                .thenApply(response -> {

                    if (
                            response.statusCode() < 200 ||
                                    response.statusCode() >= 300
                    ) {

                        throw new RuntimeException(
                                "Erro da Groq HTTP "
                                        + response.statusCode()
                                        + ": "
                                        + response.body()
                        );
                    }

                    JsonObject json =
                            gson.fromJson(
                                    response.body(),
                                    JsonObject.class
                            );

                    return json
                            .getAsJsonArray("choices")
                            .get(0)
                            .getAsJsonObject()
                            .getAsJsonObject("message")
                            .get("content")
                            .getAsString();
                });
    }
}