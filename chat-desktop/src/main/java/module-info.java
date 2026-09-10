module org.example.chatdesktop {

    requires javafx.controls;
    requires javafx.fxml;
    requires javafx.graphics;
    requires javafx.web;
    requires javafx.media;

    requires java.net.http;
    requires java.sql;
    requires com.google.gson;
    requires jdk.jsobject;
    requires org.xerial.sqlitejdbc;
    requires org.slf4j;


    exports org.example.chatdesktop;
    exports org.example.chatdesktop.bridge;
    exports org.example.chatdesktop.controller;
    exports org.example.chatdesktop.service;
    exports org.example.chatdesktop.model;
    exports org.example.chatdesktop.config;


    opens org.example.chatdesktop to javafx.fxml;
    opens org.example.chatdesktop.controller to javafx.fxml;
    opens org.example.chatdesktop.bridge to javafx.web;
    opens org.example.chatdesktop.model to com.google.gson;
}