module org.example.chatdesktop {

    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.graphics;
    requires javafx.web;
    requires javafx.media;

    requires java.net.http;
    requires com.google.gson;
    requires jdk.jsobject;

    exports org.example.chatdesktop;
    exports org.example.chatdesktop.bridge;
    exports org.example.chatdesktop.controller;
    exports org.example.chatdesktop.service;
    exports org.example.chatdesktop.model;
    exports org.example.chatdesktop.config;

    opens org.example.chatdesktop to javafx.fxml;
    opens org.example.chatdesktop.controller to javafx.fxml;

    // JSBridge é chamado via reflexão pelo WebEngine (JavaScript
    // -> Java), então o pacote precisa estar aberto para javafx.web.
    opens org.example.chatdesktop.bridge to javafx.web;
}