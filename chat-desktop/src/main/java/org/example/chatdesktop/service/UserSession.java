package org.example.chatdesktop.service;

import org.example.chatdesktop.model.User;

public class UserSession {

    private volatile User currentUser;

    public synchronized void start(User user) {

        if (user == null) {
            throw new IllegalArgumentException(
                    "O usuário da sessão não pode ser nulo."
            );
        }

        this.currentUser = user;
    }

    public synchronized void finish() {
        this.currentUser = null;
    }

    public User getCurrentUser() {
        return currentUser;
    }

    public boolean isAuthenticated() {
        return currentUser != null;
    }

    public long requireUserId() {

        User user = currentUser;

        if (user == null) {
            throw new IllegalStateException(
                    "É necessário entrar em uma conta."
            );
        }

        return user.getId();
    }
}