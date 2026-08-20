package org.example.chatdesktop;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.example.chatdesktop.config.GroqConfig;

public class Main extends Application {

    @Override
    public void start(Stage stage) throws Exception {

        // Falha rápido e com mensagem clara se a variável de ambiente
        // GROQ_API_KEY não estiver configurada, em vez de deixar o app
        // travar silenciosamente na primeira mensagem enviada.
        try {
            GroqConfig.getApiKey();
        } catch (IllegalStateException e) {
            System.err.println(e.getMessage());
        }

        FXMLLoader loader = new FXMLLoader(
                getClass().getResource("/org/example/chatdesktop/view/chat-view.fxml")
        );

        Parent root = loader.load();

        Scene scene = new Scene(root, 1280, 800);

        stage.setTitle("Orbit AI");
        stage.setScene(scene);
        stage.setMinWidth(960);
        stage.setMinHeight(620);
        stage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}