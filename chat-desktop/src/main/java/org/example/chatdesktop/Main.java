package org.example.chatdesktop;

import javafx.application.Application;
import javafx.application.Platform;
import javafx.concurrent.Worker;
import javafx.scene.Scene;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.StackPane;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import javafx.stage.Stage;
import netscape.javascript.JSObject;
import org.example.chatdesktop.bridge.JSBridge;

public class Main extends Application {

    @Override
    public void start(Stage primaryStage) {
        WebView webView = new WebView();
        WebEngine webEngine = webView.getEngine();
        webEngine.setJavaScriptEnabled(true);

        JSBridge bridge = new JSBridge(webEngine);

        // Sempre que a página (re)carrega, reinjeta o bridge no window do JS
        webEngine.getLoadWorker().stateProperty().addListener((obs, oldState, newState) -> {
            if (newState == Worker.State.SUCCEEDED) {
                try {
                    JSObject window = (JSObject) webEngine.executeScript("window");
                    window.setMember("orbitBridge", bridge);
                    webEngine.executeScript("window.orbitBridgeReady = true;");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            } else if (newState == Worker.State.FAILED) {
                System.err.println("Falha ao carregar a página do chat.");
            }
        });

        try {
            String htmlPath = getClass().getResource("/org/example/chatdesktop/web/index.html").toExternalForm();
            webEngine.load(htmlPath);
        } catch (NullPointerException e) {
            System.err.println("Erro: Arquivo index.html não encontrado na pasta resources.");
        }

        StackPane root = new StackPane(webView);
        Scene scene = new Scene(root, 1100, 700);

        // ===== ATALHOS GLOBAIS: capturados ANTES do WebView, pois Ctrl+N e Ctrl+L
        // são reservados internamente pelo motor do WebView e nunca chegariam ao JS. =====
        scene.addEventFilter(KeyEvent.KEY_PRESSED, event -> {
            if (event.isControlDown() && event.getCode() == KeyCode.N) {
                webEngine.executeScript("if(window.orbitNewChat) window.orbitNewChat();");
                event.consume();
            } else if (event.isControlDown() && event.getCode() == KeyCode.L) {
                webEngine.executeScript("if(window.orbitClearInput) window.orbitClearInput();");
                event.consume();
            }
        });

        primaryStage.setTitle("Orbit AI");
        primaryStage.setScene(scene);
        primaryStage.show();

        // Encerra as threads de rede corretamente ao fechar a janela
        primaryStage.setOnCloseRequest(e -> Platform.exit());
    }

    public static void main(String[] args) {
        launch(args);
    }
}