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

/**
 * Camada de persistência do histórico de conversas usando SQLite.
 *
 * O banco fica em ~/.orbit-ai/orbit.db — fora da pasta do projeto,
 * então sobrevive a rebuilds, reinstalações e atualizações do app.
 *
 * Todas as operações abrem/fecham conexões curtas por chamada. Como
 * cada método público já é disparado pelo JSBridge dentro de uma
 * thread separada, bloquear aqui não trava a interface.
 */
public class HistoryDatabase {

    private final String jdbcUrl;
    private final Gson gson;

    public HistoryDatabase() {
        this.gson = new Gson();
        this.jdbcUrl = "jdbc:sqlite:" + resolveDatabasePath();
        inicializarBanco();
    }

    private String resolveDatabasePath() {

        try {

            Path dir = Paths.get(
                    System.getProperty("user.home"),
                    ".orbit-ai"
            );

            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            return dir.resolve("orbit.db").toString();

        } catch (Exception e) {

            System.err.println(
                    "[DB] Não foi possível criar a pasta do banco, usando caminho local: "
                            + e.getMessage()
            );

            return "orbit.db";
        }
    }

    private Connection abrirConexao() throws SQLException {

        Connection conn = DriverManager.getConnection(jdbcUrl);

        try (Statement st = conn.createStatement()) {
            st.execute("PRAGMA foreign_keys = ON;");
        }

        return conn;
    }

    private void inicializarBanco() {

        String sqlConversas =
                "CREATE TABLE IF NOT EXISTS conversations (" +
                        "id INTEGER PRIMARY KEY, " +
                        "title TEXT NOT NULL, " +
                        "created_at TEXT NOT NULL, " +
                        "updated_at TEXT NOT NULL" +
                        ");";

        String sqlMensagens =
                "CREATE TABLE IF NOT EXISTS messages (" +
                        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                        "conversation_id INTEGER NOT NULL, " +
                        "role TEXT NOT NULL, " +
                        "text TEXT NOT NULL, " +
                        "origin TEXT, " +
                        "sources TEXT, " +
                        "is_error INTEGER NOT NULL DEFAULT 0, " +
                        "position INTEGER NOT NULL, " +
                        "FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE" +
                        ");";

        try (Connection conn = abrirConexao();
             Statement st = conn.createStatement()) {

            st.execute(sqlConversas);
            st.execute(sqlMensagens);

            System.out.println("[DB] Banco de dados pronto em: " + jdbcUrl);

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao inicializar banco: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Cria a conversa no banco usando o MESMO id já gerado pelo
     * JavaScript (conversationCounter), em vez de gerar um novo id
     * aqui — assim o JS não precisa esperar resposta assíncrona
     * do Java só para saber qual id usar.
     */
    public synchronized void criarConversa(long id, String titulo) {

        String sql =
                "INSERT OR IGNORE INTO conversations (id, title, created_at, updated_at) " +
                        "VALUES (?, ?, datetime('now'), datetime('now'))";

        try (Connection conn = abrirConexao();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, id);
            ps.setString(2, titulo);
            ps.executeUpdate();

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao criar conversa: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public synchronized void renomearConversa(long id, String novoTitulo) {

        String sql =
                "UPDATE conversations SET title = ?, updated_at = datetime('now') WHERE id = ?";

        try (Connection conn = abrirConexao();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, novoTitulo);
            ps.setLong(2, id);
            ps.executeUpdate();

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao renomear conversa: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public synchronized void apagarConversa(long id) {

        String sql = "DELETE FROM conversations WHERE id = ?";

        try (Connection conn = abrirConexao();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, id);
            ps.executeUpdate();

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao apagar conversa: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public synchronized void salvarMensagem(
            long conversationId,
            String role,
            String text,
            String origin,
            String sourcesJson,
            boolean isError
    ) {

        String sqlPosicao =
                "SELECT COALESCE(MAX(position), -1) + 1 FROM messages WHERE conversation_id = ?";

        String sqlInsert =
                "INSERT INTO messages " +
                        "(conversation_id, role, text, origin, sources, is_error, position) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = abrirConexao()) {

            int proximaPosicao = 0;

            try (PreparedStatement psPos = conn.prepareStatement(sqlPosicao)) {

                psPos.setLong(1, conversationId);

                try (ResultSet rs = psPos.executeQuery()) {

                    if (rs.next()) {
                        proximaPosicao = rs.getInt(1);
                    }
                }
            }

            try (PreparedStatement ps = conn.prepareStatement(sqlInsert)) {

                ps.setLong(1, conversationId);
                ps.setString(2, role);
                ps.setString(3, text);
                ps.setString(4, origin);
                ps.setString(5, sourcesJson);
                ps.setInt(6, isError ? 1 : 0);
                ps.setInt(7, proximaPosicao);
                ps.executeUpdate();
            }

            try (PreparedStatement psUpd = conn.prepareStatement(
                    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?")) {

                psUpd.setLong(1, conversationId);
                psUpd.executeUpdate();
            }

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao salvar mensagem: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Remove a última mensagem de uma conversa — usado quando o
     * usuário clica em "Regenerar", já que a resposta antiga é
     * descartada tanto da tela quanto do banco.
     */
    public synchronized void removerUltimaMensagem(long conversationId) {

        String sql =
                "DELETE FROM messages WHERE id = (" +
                        "SELECT id FROM messages WHERE conversation_id = ? " +
                        "ORDER BY position DESC LIMIT 1" +
                        ")";

        try (Connection conn = abrirConexao();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setLong(1, conversationId);
            ps.executeUpdate();

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao remover última mensagem: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Carrega todas as conversas e suas mensagens, prontas para
     * serem serializadas em JSON e devolvidas ao JavaScript.
     */
    public synchronized List<Map<String, Object>> carregarHistoricoCompleto() {

        List<Map<String, Object>> conversas = new ArrayList<>();

        String sqlConversas =
                "SELECT id, title FROM conversations ORDER BY updated_at DESC";

        String sqlMensagens =
                "SELECT role, text, origin, sources, is_error FROM messages " +
                        "WHERE conversation_id = ? ORDER BY position ASC";

        Type listaStringType = new TypeToken<List<String>>() {}.getType();

        try (Connection conn = abrirConexao()) {

            try (PreparedStatement psConv = conn.prepareStatement(sqlConversas);
                 ResultSet rsConv = psConv.executeQuery()) {

                while (rsConv.next()) {

                    long id = rsConv.getLong("id");
                    String titulo = rsConv.getString("title");

                    List<Map<String, Object>> mensagens = new ArrayList<>();

                    try (PreparedStatement psMsg = conn.prepareStatement(sqlMensagens)) {

                        psMsg.setLong(1, id);

                        try (ResultSet rsMsg = psMsg.executeQuery()) {

                            while (rsMsg.next()) {

                                String sourcesJson = rsMsg.getString("sources");

                                List<String> sources;

                                if (sourcesJson != null && !sourcesJson.isBlank()) {

                                    try {
                                        sources = gson.fromJson(sourcesJson, listaStringType);
                                    } catch (Exception e) {
                                        sources = new ArrayList<>();
                                    }

                                } else {
                                    sources = new ArrayList<>();
                                }

                                Map<String, Object> msg = new LinkedHashMap<>();
                                msg.put("role", rsMsg.getString("role"));
                                msg.put("text", rsMsg.getString("text"));
                                msg.put("origin", rsMsg.getString("origin"));
                                msg.put("sources", sources);
                                msg.put("isError", rsMsg.getInt("is_error") == 1);

                                mensagens.add(msg);
                            }
                        }
                    }

                    Map<String, Object> conversa = new LinkedHashMap<>();
                    conversa.put("id", id);
                    conversa.put("title", titulo);
                    conversa.put("messages", mensagens);

                    conversas.add(conversa);
                }
            }

        } catch (SQLException e) {

            System.err.println("[DB] Erro ao carregar histórico: " + e.getMessage());
            e.printStackTrace();
        }

        return conversas;
    }
}