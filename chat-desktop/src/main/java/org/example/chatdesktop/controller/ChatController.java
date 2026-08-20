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

    @FXML
    private void initialize() {

        WebEngine engine = webView.getEngine();
        engine.setJavaScriptEnabled(true);

        // Sempre que a página (re)carrega, precisamos re-injetar a ponte,
        // pois o "window" do JS é recriado a cada load.
        engine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.SUCCEEDED) {
                JSObject window = (JSObject) engine.executeScript("window");
                window.setMember("javaBridge", new JSBridge(engine));
                engine.executeScript("window.javaBridgeReady = true;");
            }
        });

        engine.load(
                getClass()
                        .getResource("/org/example/chatdesktop/web/index.html")
                        .toExternalForm()
        );
    }
}