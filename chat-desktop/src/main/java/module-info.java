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


    opens org.example.chatdesktop.bridge
            to javafx.web;
}