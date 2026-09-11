package org.example.chatdesktop.service;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public final class PasswordService {

    private static final String ALGORITHM =
            "PBKDF2WithHmacSHA256";

    private static final String STORAGE_PREFIX =
            "pbkdf2_sha256";

    private static final int ITERATIONS =
            210_000;

    private static final int KEY_LENGTH =
            256;

    private static final int SALT_LENGTH =
            16;

    private static final SecureRandom SECURE_RANDOM =
            new SecureRandom();

    private PasswordService() {
    }

    public static String hashPassword(String password) {

        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException(
                    "A senha não pode estar vazia."
            );
        }

        byte[] salt = new byte[SALT_LENGTH];
        SECURE_RANDOM.nextBytes(salt);

        byte[] hash = generateHash(
                password.toCharArray(),
                salt,
                ITERATIONS,
                KEY_LENGTH
        );

        return STORAGE_PREFIX
                + "$"
                + ITERATIONS
                + "$"
                + Base64.getEncoder().encodeToString(salt)
                + "$"
                + Base64.getEncoder().encodeToString(hash);
    }

    public static boolean verifyPassword(
            String password,
            String storedPassword
    ) {

        if (
                password == null ||
                        storedPassword == null ||
                        storedPassword.isBlank()
        ) {
            return false;
        }

        try {

            String[] parts =
                    storedPassword.split("\\$");

            if (parts.length != 4) {
                return false;
            }

            if (!STORAGE_PREFIX.equals(parts[0])) {
                return false;
            }

            int iterations =
                    Integer.parseInt(parts[1]);

            byte[] salt =
                    Base64.getDecoder().decode(parts[2]);

            byte[] expectedHash =
                    Base64.getDecoder().decode(parts[3]);

            byte[] receivedHash =
                    generateHash(
                            password.toCharArray(),
                            salt,
                            iterations,
                            expectedHash.length * 8
                    );

            return MessageDigest.isEqual(
                    expectedHash,
                    receivedHash
            );

        } catch (Exception e) {

            System.err.println(
                    "[AUTH] Não foi possível verificar a senha: "
                            + e.getMessage()
            );

            return false;
        }
    }

    private static byte[] generateHash(
            char[] password,
            byte[] salt,
            int iterations,
            int keyLength
    ) {

        PBEKeySpec specification =
                new PBEKeySpec(
                        password,
                        salt,
                        iterations,
                        keyLength
                );

        try {

            SecretKeyFactory factory =
                    SecretKeyFactory.getInstance(ALGORITHM);

            return factory
                    .generateSecret(specification)
                    .getEncoded();

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Não foi possível proteger a senha.",
                    e
            );

        } finally {

            specification.clearPassword();
        }
    }
}