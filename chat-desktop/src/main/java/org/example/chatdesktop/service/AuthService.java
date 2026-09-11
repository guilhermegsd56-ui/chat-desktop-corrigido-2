package org.example.chatdesktop.service;

import org.example.chatdesktop.model.User;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Locale;
import java.util.regex.Pattern;

public class AuthService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile(
                    "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
            );

    private static final Pattern UPPERCASE_PATTERN =
            Pattern.compile("[A-Z]");

    private static final Pattern LOWERCASE_PATTERN =
            Pattern.compile("[a-z]");

    private static final Pattern NUMBER_PATTERN =
            Pattern.compile("[0-9]");

    private static final Pattern SPECIAL_PATTERN =
            Pattern.compile("[^A-Za-z0-9]");

    private final String jdbcUrl;

    public AuthService() {

        this.jdbcUrl =
                "jdbc:sqlite:" + resolveDatabasePath();

        initializeDatabase();
    }

    private String resolveDatabasePath() {

        try {

            Path directory =
                    Paths.get(
                            System.getProperty("user.home"),
                            ".orbit-ai"
                    );

            if (!Files.exists(directory)) {
                Files.createDirectories(directory);
            }

            return directory
                    .resolve("orbit.db")
                    .toString();

        } catch (Exception e) {

            System.err.println(
                    "[AUTH] Não foi possível acessar a pasta "
                            + "do Orbit: "
                            + e.getMessage()
            );

            return "orbit.db";
        }
    }

    private Connection openConnection()
            throws SQLException {

        Connection connection =
                DriverManager.getConnection(jdbcUrl);

        try (Statement statement =
                     connection.createStatement()) {

            statement.execute(
                    "PRAGMA foreign_keys = ON;"
            );

            statement.execute(
                    "PRAGMA busy_timeout = 5000;"
            );
        }

        return connection;
    }

    private void initializeDatabase() {

        String sql =
                "CREATE TABLE IF NOT EXISTS users (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "name TEXT NOT NULL, " +
                        "email TEXT NOT NULL COLLATE NOCASE UNIQUE, " +
                        "password_hash TEXT NOT NULL, " +
                        "created_at TEXT NOT NULL DEFAULT (datetime('now')), " +
                        "updated_at TEXT NOT NULL DEFAULT (datetime('now'))" +
                        ");";

        try (
                Connection connection = openConnection();
                Statement statement =
                        connection.createStatement()
        ) {

            statement.execute(sql);

            System.out.println(
                    "[AUTH] Tabela de usuários pronta."
            );

        } catch (SQLException e) {

            System.err.println(
                    "[AUTH] Erro ao inicializar autenticação: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public AuthResult register(
            String name,
            String email,
            String password
    ) {

        String normalizedName =
                normalizeName(name);

        String normalizedEmail =
                normalizeEmail(email);

        String validationError =
                validateRegistration(
                        normalizedName,
                        normalizedEmail,
                        password
                );

        if (validationError != null) {
            return AuthResult.failure(validationError);
        }

        if (emailAlreadyExists(normalizedEmail)) {

            return AuthResult.failure(
                    "Já existe uma conta com esse e-mail."
            );
        }

        String passwordHash;

        try {

            passwordHash =
                    PasswordService.hashPassword(password);

        } catch (Exception e) {

            return AuthResult.failure(
                    "Não foi possível proteger a senha."
            );
        }

        String insertSql =
                "INSERT INTO users " +
                        "(name, email, password_hash) " +
                        "VALUES (?, ?, ?)";

        try (Connection connection = openConnection()) {

            connection.setAutoCommit(false);

            try (
                    PreparedStatement statement =
                            connection.prepareStatement(insertSql)
            ) {

                statement.setString(1, normalizedName);
                statement.setString(2, normalizedEmail);
                statement.setString(3, passwordHash);
                statement.executeUpdate();

                long userId;

                try (
                        Statement idStatement =
                                connection.createStatement();

                        ResultSet resultSet =
                                idStatement.executeQuery(
                                        "SELECT last_insert_rowid()"
                                )
                ) {

                    if (!resultSet.next()) {

                        connection.rollback();

                        return AuthResult.failure(
                                "Não foi possível criar a conta."
                        );
                    }

                    userId = resultSet.getLong(1);
                }

                User user =
                        findUserById(
                                connection,
                                userId
                        );

                if (user == null) {

                    connection.rollback();

                    return AuthResult.failure(
                            "A conta foi criada, mas não pôde ser carregada."
                    );
                }

                connection.commit();

                return AuthResult.success(
                        "Cadastro realizado com sucesso.",
                        user
                );

            } catch (SQLException e) {

                connection.rollback();

                if (isUniqueConstraintError(e)) {

                    return AuthResult.failure(
                            "Já existe uma conta com esse e-mail."
                    );
                }

                System.err.println(
                        "[AUTH] Erro ao cadastrar usuário: "
                                + e.getMessage()
                );

                return AuthResult.failure(
                        "Não foi possível realizar o cadastro."
                );

            } finally {

                try {
                    connection.setAutoCommit(true);
                } catch (SQLException ignored) {
                }
            }

        } catch (SQLException e) {

            System.err.println(
                    "[AUTH] Erro de conexão durante o cadastro: "
                            + e.getMessage()
            );

            return AuthResult.failure(
                    "Não foi possível acessar o banco de dados."
            );
        }
    }

    public AuthResult login(
            String email,
            String password
    ) {

        String normalizedEmail =
                normalizeEmail(email);

        if (normalizedEmail.isBlank()) {

            return AuthResult.failure(
                    "Informe seu e-mail."
            );
        }

        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {

            return AuthResult.failure(
                    "Informe um e-mail válido."
            );
        }

        if (password == null || password.isBlank()) {

            return AuthResult.failure(
                    "Informe sua senha."
            );
        }

        String sql =
                "SELECT id, name, email, password_hash, created_at " +
                        "FROM users " +
                        "WHERE email = ? COLLATE NOCASE " +
                        "LIMIT 1";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, normalizedEmail);

            try (ResultSet resultSet =
                         statement.executeQuery()) {

                if (!resultSet.next()) {

                    return AuthResult.failure(
                            "E-mail ou senha incorretos."
                    );
                }

                String storedPassword =
                        resultSet.getString("password_hash");

                if (!PasswordService.verifyPassword(
                        password,
                        storedPassword
                )) {

                    return AuthResult.failure(
                            "E-mail ou senha incorretos."
                    );
                }

                User user =
                        mapUser(resultSet);

                return AuthResult.success(
                        "Login realizado com sucesso.",
                        user
                );
            }

        } catch (SQLException e) {

            System.err.println(
                    "[AUTH] Erro ao realizar login: "
                            + e.getMessage()
            );

            return AuthResult.failure(
                    "Não foi possível acessar sua conta."
            );
        }
    }

    public User findUser(long userId) {

        try (Connection connection = openConnection()) {

            return findUserById(
                    connection,
                    userId
            );

        } catch (SQLException e) {

            System.err.println(
                    "[AUTH] Erro ao procurar usuário: "
                            + e.getMessage()
            );

            return null;
        }
    }

    private User findUserById(
            Connection connection,
            long userId
    ) throws SQLException {

        String sql =
                "SELECT id, name, email, created_at " +
                        "FROM users WHERE id = ? LIMIT 1";

        try (PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setLong(1, userId);

            try (ResultSet resultSet =
                         statement.executeQuery()) {

                if (!resultSet.next()) {
                    return null;
                }

                return mapUser(resultSet);
            }
        }
    }

    private User mapUser(ResultSet resultSet)
            throws SQLException {

        return new User(
                resultSet.getLong("id"),
                resultSet.getString("name"),
                resultSet.getString("email"),
                resultSet.getString("created_at")
        );
    }

    private boolean emailAlreadyExists(String email) {

        String sql =
                "SELECT 1 FROM users " +
                        "WHERE email = ? COLLATE NOCASE " +
                        "LIMIT 1";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, email);

            try (ResultSet resultSet =
                         statement.executeQuery()) {

                return resultSet.next();
            }

        } catch (SQLException e) {

            System.err.println(
                    "[AUTH] Erro ao verificar e-mail: "
                            + e.getMessage()
            );

            return false;
        }
    }

    private String validateRegistration(
            String name,
            String email,
            String password
    ) {

        if (name.isBlank()) {
            return "Informe seu nome.";
        }

        if (name.length() < 2) {
            return "O nome precisa ter pelo menos 2 caracteres.";
        }

        if (name.length() > 60) {
            return "O nome pode ter no máximo 60 caracteres.";
        }

        if (email.isBlank()) {
            return "Informe seu e-mail.";
        }

        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return "Informe um e-mail válido.";
        }

        return validatePassword(password);
    }

    private String validatePassword(String password) {

        if (password == null || password.isBlank()) {
            return "Informe uma senha.";
        }

        if (password.length() < 8) {
            return "A senha precisa ter pelo menos 8 caracteres.";
        }

        if (password.length() > 128) {
            return "A senha pode ter no máximo 128 caracteres.";
        }

        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            return "Inclua pelo menos uma letra maiúscula na senha.";
        }

        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            return "Inclua pelo menos uma letra minúscula na senha.";
        }

        if (!NUMBER_PATTERN.matcher(password).find()) {
            return "Inclua pelo menos um número na senha.";
        }

        if (!SPECIAL_PATTERN.matcher(password).find()) {
            return "Inclua pelo menos um caractere especial na senha.";
        }

        return null;
    }

    private String normalizeName(String name) {

        if (name == null) {
            return "";
        }

        return name
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String normalizeEmail(String email) {

        if (email == null) {
            return "";
        }

        return email
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private boolean isUniqueConstraintError(
            SQLException exception
    ) {

        String message = exception.getMessage();

        return message != null
                && message
                .toLowerCase(Locale.ROOT)
                .contains("unique");
    }

    public static final class AuthResult {

        private final boolean success;
        private final String message;
        private final User user;

        private AuthResult(
                boolean success,
                String message,
                User user
        ) {
            this.success = success;
            this.message = message;
            this.user = user;
        }

        public static AuthResult success(
                String message,
                User user
        ) {
            return new AuthResult(
                    true,
                    message,
                    user
            );
        }

        public static AuthResult failure(
                String message
        ) {
            return new AuthResult(
                    false,
                    message,
                    null
            );
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        public User getUser() {
            return user;
        }
    }
}