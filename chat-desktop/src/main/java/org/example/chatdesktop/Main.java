package org.example.chatdesktop;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.example.chatdesktop.config.GroqConfig;

public class Main extends Application {

    @Override
    public void start(
            Stage stage
    ) throws Exception {

        /*
         * Verifica se a chave da Groq existe
         * antes de iniciar a aplicação.
         */
        try {

            GroqConfig.getApiKey();

            System.out.println(
                    "GROQ_API_KEY configurada com sucesso."
            );

        } catch (
                IllegalStateException e
        ) {

            System.err.println(
                    "ERRO: " + e.getMessage()
            );

            return;
        }


        FXMLLoader loader =
                new FXMLLoader(
                        getClass().getResource(
                                "/org/example/chatdesktop/view/chat-view.fxml"
                        )
                );


        Parent root =
                loader.load();


        Scene scene =
                new Scene(
                        root,
                        1280,
                        800
                );


        stage.setTitle(
                "Orbit AI"
        );


        stage.setScene(
                scene
        );


        stage.setMinWidth(
                960
        );


        stage.setMinHeight(
                620
        );


        stage.show();
    }


    public static void main(
            String[] args
    ) {

        launch(args);
    }
}