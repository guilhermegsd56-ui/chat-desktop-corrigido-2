package org.example.chatdesktop.controller;

import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.TextArea;
import javafx.scene.control.TextField;
import javafx.scene.input.KeyCode;
import javafx.scene.input.KeyEvent;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;
import javafx.scene.web.WebEngine;
import javafx.scene.web.WebView;
import netscape.javascript.JSObject;

import org.example.chatdesktop.bridge.JSBridge;

import java.io.IOException;

public class ChatController {

    @FXML private WebView webView;
    @FXML private TextField messageInput;
    @FXML private TextArea textArea;
    @FXML private Button sendButton;
    @FXML private Button newConversationButton;
    @FXML private Button clearButton;
    @FXML private VBox messagesContainer;

    private WebEngine engine;
    private JSBridge bridge;

    @FXML
    public void initialize() {
        if (webView != null) {
            engine = webView.getEngine();
            bridge = new JSBridge(engine);

            try {
                engine.getLoadWorker()
                        .stateProperty()
                        .addListener((observable, oldState, newState) -> {
                            if (newState == javafx.concurrent.Worker.State.SUCCEEDED) {
                                configurarBridge();
                            }
                        });
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        configurarAtalhos();
    }

    private void configurarBridge() {
        if (engine == null || bridge == null) return;

        try {
            JSObject window = (JSObject) engine.executeScript("window");
            // Injeta o objeto exatamente com o nome que o script.js procura
            window.setMember("orbitBridge", bridge);
            // Informa ao JS que a ponte está pronta para uso
            engine.executeScript("window.orbitBridgeReady = true;");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void configurarAtalhos() {
        if (messageInput == null) return;

        messageInput.addEventHandler(KeyEvent.KEY_PRESSED, event -> {
            if (event.getCode() == KeyCode.ENTER && !event.isShiftDown()) {
                enviarMensagem();
                event.consume();
            }

            if (event.isControlDown() && event.getCode() == KeyCode.L) {
                limparCampo();
                event.consume();
            }
        });
    }

    @FXML
    private void enviarMensagem() {
        if (messageInput == null) return;

        String mensagem = messageInput.getText().trim();
        if (mensagem.isEmpty()) return;

        if (bridge == null) {
            System.err.println("JSBridge não foi inicializado.");
            return;
        }

        bridge.ask(mensagem);
        messageInput.clear();
    }

    @FXML
    private void novaConversa() {
        if (bridge != null) {
            bridge.newConversation();
        } else if (messageInput != null) {
            messageInput.clear();
        }
    }

    @FXML
    private void limparCampo() {
        if (messageInput != null) {
            messageInput.clear();
            messageInput.requestFocus();
        }
        if (bridge != null) {
            bridge.clearInput();
        }
    }

    @FXML
    private void voltarInicio(javafx.event.ActionEvent event) {
        try {
            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource("/org/example/chatdesktop/view/index.fxml")
            );
            Parent root = loader.load();
            Stage stage = (Stage) ((Node) event.getSource()).getScene().getWindow();
            Scene scene = new Scene(root, 1280, 720);
            stage.setScene(scene);
            stage.show();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @FXML
    private void temaEscuro() {
        if (bridge != null) bridge.changeTheme("dark");
    }

    @FXML
    private void temaClaro() {
        if (bridge != null) bridge.changeTheme("light");
    }

    @FXML
    private void alternarTema() {
        if (bridge == null) return;
        bridge.changeTheme("light");
    }

    public WebEngine getEngine() {
        return engine;
    }

    public JSBridge getBridge() {
        return bridge;
    }

    public void carregarPagina(String url) {
        if (engine == null) return;
        if (url == null || url.isBlank()) return;
        engine.load(url);
    }
}