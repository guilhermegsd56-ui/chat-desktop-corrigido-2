package org.example.chatdesktop.service;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class HistoryDatabase {

    private final String jdbcUrl;
    private final Gson gson;

    public HistoryDatabase() {
        this.gson = new Gson();
        this.jdbcUrl = "jdbc:sqlite:" + resolveDatabasePath();

        initializeDatabase();
    }

    private String resolveDatabasePath() {

        try {

            Path directory = Paths.get(
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
                    "[DB] Não foi possível criar a pasta do banco: "
                            + e.getMessage()
            );

            return "orbit.db";
        }
    }

    private Connection openConnection() throws SQLException {

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

        String usersSql =
                "CREATE TABLE IF NOT EXISTS users (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "name TEXT NOT NULL, " +
                        "email TEXT NOT NULL COLLATE NOCASE UNIQUE, " +
                        "password_hash TEXT NOT NULL, " +
                        "created_at TEXT NOT NULL DEFAULT (datetime('now')), " +
                        "updated_at TEXT NOT NULL DEFAULT (datetime('now'))" +
                        ");";

        String conversationsSql =
                "CREATE TABLE IF NOT EXISTS conversations (" +
                        "id INTEGER PRIMARY KEY, " +
                        "user_id INTEGER, " +
                        "title TEXT NOT NULL, " +
                        "created_at TEXT NOT NULL, " +
                        "updated_at TEXT NOT NULL, " +
                        "FOREIGN KEY (user_id) " +
                        "REFERENCES users(id) ON DELETE CASCADE" +
                        ");";

        String messagesSql =
                "CREATE TABLE IF NOT EXISTS messages (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "conversation_id INTEGER NOT NULL, " +
                        "role TEXT NOT NULL, " +
                        "text TEXT NOT NULL, " +
                        "origin TEXT, " +
                        "sources TEXT, " +
                        "is_error INTEGER NOT NULL DEFAULT 0, " +
                        "position INTEGER NOT NULL, " +
                        "FOREIGN KEY (conversation_id) " +
                        "REFERENCES conversations(id) ON DELETE CASCADE" +
                        ");";

        try (
                Connection connection = openConnection();
                Statement statement =
                        connection.createStatement()
        ) {

            statement.execute(usersSql);
            statement.execute(conversationsSql);
            statement.execute(messagesSql);

            migrateConversationsTable(
                    connection
            );

            statement.execute(
                    "CREATE INDEX IF NOT EXISTS " +
                            "idx_conversations_user_id " +
                            "ON conversations(user_id);"
            );

            statement.execute(
                    "CREATE INDEX IF NOT EXISTS " +
                            "idx_messages_conversation_position " +
                            "ON messages(conversation_id, position);"
            );

            System.out.println(
                    "[DB] Banco de dados pronto em: "
                            + jdbcUrl
            );

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao inicializar banco: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    private void migrateConversationsTable(
            Connection connection
    ) throws SQLException {

        if (columnExists(
                connection,
                "conversations",
                "user_id"
        )) {
            return;
        }

        try (Statement statement =
                     connection.createStatement()) {

            statement.execute(
                    "ALTER TABLE conversations " +
                            "ADD COLUMN user_id INTEGER"
            );

            System.out.println(
                    "[DB] Coluna user_id adicionada às conversas."
            );
        }
    }

    private boolean columnExists(
            Connection connection,
            String table,
            String column
    ) throws SQLException {

        String sql =
                "PRAGMA table_info(" + table + ")";

        try (
                Statement statement =
                        connection.createStatement();

                ResultSet resultSet =
                        statement.executeQuery(sql)
        ) {

            while (resultSet.next()) {

                if (column.equalsIgnoreCase(
                        resultSet.getString("name")
                )) {
                    return true;
                }
            }
        }

        return false;
    }

    /*
     * As conversas criadas antes da autenticação possuem
     * user_id nulo. O primeiro usuário autenticado no dispositivo
     * recebe esse histórico antigo, evitando perda de dados.
     */
    public synchronized void adoptLegacyHistory(
            long userId
    ) {

        String sql =
                "UPDATE conversations " +
                        "SET user_id = ? " +
                        "WHERE user_id IS NULL";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(1, userId);

            int updated =
                    statement.executeUpdate();

            if (updated > 0) {

                System.out.println(
                        "[DB] " + updated +
                                " conversa(s) antiga(s) associada(s) " +
                                "ao usuário " + userId + "."
                );
            }

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao migrar histórico antigo: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public synchronized void createConversation(
            long userId,
            long conversationId,
            String title
    ) {

        String sql =
                "INSERT INTO conversations " +
                        "(id, user_id, title, created_at, updated_at) " +
                        "VALUES (?, ?, ?, datetime('now'), datetime('now'))";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(1, conversationId);
            statement.setLong(2, userId);
            statement.setString(3, normalizeTitle(title));

            statement.executeUpdate();

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao criar conversa: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public synchronized void renameConversation(
            long userId,
            long conversationId,
            String newTitle
    ) {

        String sql =
                "UPDATE conversations " +
                        "SET title = ?, updated_at = datetime('now') " +
                        "WHERE id = ? AND user_id = ?";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    normalizeTitle(newTitle)
            );

            statement.setLong(2, conversationId);
            statement.setLong(3, userId);

            statement.executeUpdate();

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao renomear conversa: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public synchronized void deleteConversation(
            long userId,
            long conversationId
    ) {

        String sql =
                "DELETE FROM conversations " +
                        "WHERE id = ? AND user_id = ?";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(1, conversationId);
            statement.setLong(2, userId);

            statement.executeUpdate();

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao apagar conversa: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public synchronized void saveMessage(
            long userId,
            long conversationId,
            String role,
            String text,
            String origin,
            String sourcesJson,
            boolean isError
    ) {

        String ownershipSql =
                "SELECT 1 FROM conversations " +
                        "WHERE id = ? AND user_id = ? " +
                        "LIMIT 1";

        String positionSql =
                "SELECT COALESCE(MAX(position), -1) + 1 " +
                        "FROM messages " +
                        "WHERE conversation_id = ?";

        String insertSql =
                "INSERT INTO messages " +
                        "(conversation_id, role, text, origin, " +
                        "sources, is_error, position) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";

        String updateSql =
                "UPDATE conversations " +
                        "SET updated_at = datetime('now') " +
                        "WHERE id = ? AND user_id = ?";

        try (Connection connection = openConnection()) {

            connection.setAutoCommit(false);

            try {

                if (!userOwnsConversation(
                        connection,
                        ownershipSql,
                        userId,
                        conversationId
                )) {

                    connection.rollback();

                    System.err.println(
                            "[DB] Mensagem ignorada: a conversa não " +
                                    "pertence ao usuário autenticado."
                    );

                    return;
                }

                int nextPosition = 0;

                try (
                        PreparedStatement positionStatement =
                                connection.prepareStatement(
                                        positionSql
                                )
                ) {

                    positionStatement.setLong(
                            1,
                            conversationId
                    );

                    try (ResultSet resultSet =
                                 positionStatement.executeQuery()) {

                        if (resultSet.next()) {
                            nextPosition =
                                    resultSet.getInt(1);
                        }
                    }
                }

                try (
                        PreparedStatement insertStatement =
                                connection.prepareStatement(
                                        insertSql
                                )
                ) {

                    insertStatement.setLong(
                            1,
                            conversationId
                    );

                    insertStatement.setString(2, role);
                    insertStatement.setString(3, text);
                    insertStatement.setString(4, origin);
                    insertStatement.setString(5, sourcesJson);

                    insertStatement.setInt(
                            6,
                            isError ? 1 : 0
                    );

                    insertStatement.setInt(
                            7,
                            nextPosition
                    );

                    insertStatement.executeUpdate();
                }

                try (
                        PreparedStatement updateStatement =
                                connection.prepareStatement(
                                        updateSql
                                )
                ) {

                    updateStatement.setLong(
                            1,
                            conversationId
                    );

                    updateStatement.setLong(
                            2,
                            userId
                    );

                    updateStatement.executeUpdate();
                }

                connection.commit();

            } catch (SQLException e) {

                connection.rollback();
                throw e;

            } finally {

                try {
                    connection.setAutoCommit(true);
                } catch (SQLException ignored) {
                }
            }

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao salvar mensagem: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    private boolean userOwnsConversation(
            Connection connection,
            String sql,
            long userId,
            long conversationId
    ) throws SQLException {

        try (
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(1, conversationId);
            statement.setLong(2, userId);

            try (ResultSet resultSet =
                         statement.executeQuery()) {

                return resultSet.next();
            }
        }
    }

    public synchronized void removeLastMessage(
            long userId,
            long conversationId
    ) {

        String sql =
                "DELETE FROM messages " +
                        "WHERE id = (" +
                        "SELECT messages.id " +
                        "FROM messages " +
                        "INNER JOIN conversations " +
                        "ON conversations.id = messages.conversation_id " +
                        "WHERE messages.conversation_id = ? " +
                        "AND conversations.user_id = ? " +
                        "ORDER BY messages.position DESC " +
                        "LIMIT 1" +
                        ")";

        try (
                Connection connection = openConnection();
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(1, conversationId);
            statement.setLong(2, userId);

            statement.executeUpdate();

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao remover última mensagem: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }
    }

    public synchronized List<Map<String, Object>>
    loadCompleteHistory(long userId) {

        List<Map<String, Object>> conversations =
                new ArrayList<>();

        String conversationsSql =
                "SELECT id, title " +
                        "FROM conversations " +
                        "WHERE user_id = ? " +
                        "ORDER BY updated_at DESC";

        String messagesSql =
                "SELECT role, text, origin, sources, is_error " +
                        "FROM messages " +
                        "WHERE conversation_id = ? " +
                        "ORDER BY position ASC";

        Type stringListType =
                new TypeToken<List<String>>() {
                }.getType();

        try (Connection connection = openConnection()) {

            try (
                    PreparedStatement conversationStatement =
                            connection.prepareStatement(
                                    conversationsSql
                            )
            ) {

                conversationStatement.setLong(
                        1,
                        userId
                );

                try (ResultSet conversationResult =
                             conversationStatement.executeQuery()) {

                    while (conversationResult.next()) {

                        long conversationId =
                                conversationResult.getLong("id");

                        String title =
                                conversationResult.getString("title");

                        List<Map<String, Object>> messages =
                                loadMessages(
                                        connection,
                                        messagesSql,
                                        conversationId,
                                        stringListType
                                );

                        Map<String, Object> conversation =
                                new LinkedHashMap<>();

                        conversation.put(
                                "id",
                                conversationId
                        );

                        conversation.put(
                                "title",
                                title
                        );

                        conversation.put(
                                "messages",
                                messages
                        );

                        conversations.add(
                                conversation
                        );
                    }
                }
            }

        } catch (SQLException e) {

            System.err.println(
                    "[DB] Erro ao carregar histórico: "
                            + e.getMessage()
            );

            e.printStackTrace();
        }

        return conversations;
    }

    private List<Map<String, Object>> loadMessages(
            Connection connection,
            String sql,
            long conversationId,
            Type stringListType
    ) throws SQLException {

        List<Map<String, Object>> messages =
                new ArrayList<>();

        try (
                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setLong(
                    1,
                    conversationId
            );

            try (ResultSet resultSet =
                         statement.executeQuery()) {

                while (resultSet.next()) {

                    String sourcesJson =
                            resultSet.getString("sources");

                    List<String> sources =
                            parseSources(
                                    sourcesJson,
                                    stringListType
                            );

                    Map<String, Object> message =
                            new LinkedHashMap<>();

                    message.put(
                            "role",
                            resultSet.getString("role")
                    );

                    message.put(
                            "text",
                            resultSet.getString("text")
                    );

                    message.put(
                            "origin",
                            resultSet.getString("origin")
                    );

                    message.put(
                            "sources",
                            sources
                    );

                    message.put(
                            "isError",
                            resultSet.getInt("is_error") == 1
                    );

                    messages.add(message);
                }
            }
        }

        return messages;
    }

    private List<String> parseSources(
            String sourcesJson,
            Type type
    ) {

        if (
                sourcesJson == null ||
                        sourcesJson.isBlank()
        ) {
            return new ArrayList<>();
        }

        try {

            List<String> sources =
                    gson.fromJson(
                            sourcesJson,
                            type
                    );

            return sources != null
                    ? sources
                    : new ArrayList<>();

        } catch (Exception e) {

            return new ArrayList<>();
        }
    }

    private String normalizeTitle(String title) {

        if (title == null || title.isBlank()) {
            return "Nova conversa";
        }

        String normalized =
                title.trim().replaceAll("\\s+", " ");

        return normalized.length() <= 60
                ? normalized
                : normalized.substring(0, 60);
    }
}