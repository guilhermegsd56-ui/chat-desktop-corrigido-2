module org.example.chatdesktop {

    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.web;
    requires java.net.http;
    requires com.google.gson;
    requires jdk.jsobject;

    exports org.example.chatdesktop;
    exports org.example.chatdesktop.bridge;

    opens org.example.chatdesktop.controller
            to javafx.fxml;

    // Necessário para o JavaScript da WebView chamar métodos públicos desta classe
    opens org.example.chatdesktop.bridge
            to javafx.web;
}