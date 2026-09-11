package org.example.chatdesktop.model;

public class User {

    private final long id;
    private final String name;
    private final String email;
    private final String createdAt;

    public User(
            long id,
            String name,
            String email,
            String createdAt
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
    }

    public long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getCreatedAt() {
        return createdAt;
    }
}