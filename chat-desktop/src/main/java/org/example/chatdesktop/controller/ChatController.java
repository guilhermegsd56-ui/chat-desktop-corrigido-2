package org.example.chatdesktop.controller;

import javafx.concurrent.Worker;
import javafx.fxml.FXML;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import netscape.javascript.JSObject;
import org.example.chatdesktop.bridge.JSBridge;

public class ChatController {

    @FXML
    private WebView webView;

    private JSBridge jsBridge;

    @FXML
    public void initialize() {

        WebEngine engine = webView.getEngine();

        engine.setJavaScriptEnabled(true);

        System.out.println("WebView iniciada.");

        engine.getLoadWorker()
                .stateProperty()
                .addListener((observable, oldState, newState) -> {

                    System.out.println(
                            "Estado WebView: " + newState
                    );

                    if (newState == Worker.State.SUCCEEDED) {

                        System.out.println(
                                "HTML carregado com sucesso."
                        );

                        try {

                            /*
                             * Cria a ponte Java ↔ JavaScript.
                             */
                            jsBridge =
                                    new JSBridge(engine);


                            /*
                             * Obtém o objeto window do JavaScript.
                             */
                            JSObject window =
                                    (JSObject) engine.executeScript(
                                            "window"
                                    );


                            /*
                             * Disponibiliza o JSBridge para o JavaScript.
                             */
                            window.setMember(
                                    "javaBridge",
                                    jsBridge
                            );


                            /*
                             * Informa ao JavaScript que
                             * a ponte está pronta.
                             */
                            engine.executeScript(
                                    "window.javaBridgeReady = true;"
                            );


                            /*
                             * Remove a mensagem de inicialização.
                             */
                            engine.executeScript(
                                    """
                                    if (typeof window.orbitReady === 'function') {
                                        window.orbitReady();
                                    }
                                    """
                            );


                            System.out.println(
                                    "JSBridge configurado com sucesso."
                            );

                        } catch (Exception e) {

                            System.err.println(
                                    "Erro ao configurar JSBridge:"
                            );

                            e.printStackTrace();
                        }
                    }
                });


        /*
         * Carrega o HTML.
         */
        var resource =
                getClass().getResource(
                        "/org/example/chatdesktop/web/index.html"
                );


        if (resource == null) {

            System.err.println(
                    "ERRO: index.html não encontrado."
            );

            return;
        }


        engine.load(
                resource.toExternalForm()
        );
    }
}