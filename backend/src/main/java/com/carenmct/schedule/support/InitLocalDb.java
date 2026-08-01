package com.carenmct.schedule.support;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Comparator;
import java.util.stream.Stream;

/** 로컬 MariaDB DDL·dev 시드 적용 — {@code ./gradlew initLocalDb} */
public final class InitLocalDb {

    private static final String DEFAULT_HOST = "localhost";
    private static final String DEFAULT_PORT = "3306";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASSWORD = "root";

    private InitLocalDb() {}

    public static void main(String[] args) throws IOException, SQLException {
        String host = env("DB_HOST", DEFAULT_HOST);
        String port = env("DB_PORT", DEFAULT_PORT);
        String user = env("DB_USER", DEFAULT_USER);
        String password = env("DB_PASSWORD", DEFAULT_PASSWORD);

        Path dbDir = Path.of("src/main/resources/db");

        bootstrapDatabases(host, port, user, password);
        // com 스키마는 업무포털(Hibernate)에서 관리 — carenmct_com.sql 은 SSOT 참조용, 로컬 DB에 덮어쓰지 않음
        runScript(
                host,
                port,
                user,
                password,
                "carenmct_com",
                dbDir.resolve("dev/carenmct_com_dev_contact_seed.sql"));
        runScript(host, port, user, password, "carenmct_schedule", dbDir.resolve("carenmct_schedule.sql"));
        runMigrations(host, port, user, password, "carenmct_schedule", dbDir.resolve("migrations"));
        runScript(
                host, port, user, password, "carenmct_schedule", dbDir.resolve("dev/carenmct_schedule_dev_seed.sql"));
        runScript(
                host,
                port,
                user,
                password,
                "carenmct_schedule",
                dbDir.resolve("dev/carenmct_schedule_dev_reference_seed.sql"));

        System.out.println();
        System.out.println("initLocalDb completed.");
        System.out.println("  DDL : carenmct_schedule.sql (FK → existing carenmct_com)");
        System.out.println("  Mig : db/migrations/*.sql");
        System.out.println("  Data: carenmct_com recipients/employees mobile + guardians (relation_direct=dev_seed)");
        System.out.println("  Data: sch_service_schedules (source=dev_seed)");
        System.out.println("  Data: sch_annual_benefit_limits / sch_annual_fee_rate_* (note=dev_seed)");
    }

    private static void bootstrapDatabases(String host, String port, String user, String password)
            throws SQLException {
        String jdbcBase = jdbcUrl(host, port, "");
        try (Connection connection = DriverManager.getConnection(jdbcBase, user, password);
                Statement statement = connection.createStatement()) {
            statement.execute(
                    """
                    CREATE DATABASE IF NOT EXISTS carenmct_schedule
                      CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
                    """);
        }
    }

    private static void runMigrations(
            String host, String port, String user, String password, String database, Path migrationsDir)
            throws IOException, SQLException {
        if (!Files.isDirectory(migrationsDir)) {
            return;
        }

        try (Stream<Path> paths = Files.list(migrationsDir)) {
            paths.filter(path -> path.getFileName().toString().endsWith(".sql"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .forEach(path -> {
                        try {
                            runScript(host, port, user, password, database, path);
                        } catch (IOException | SQLException ex) {
                            throw new IllegalStateException("Migration failed: " + path.getFileName(), ex);
                        }
                    });
        }
    }

    private static void runScript(
            String host, String port, String user, String password, String database, Path scriptPath)
            throws IOException, SQLException {
        if (!Files.exists(scriptPath)) {
            throw new IllegalStateException("SQL script not found: " + scriptPath.toAbsolutePath());
        }

        String sql = Files.readString(scriptPath, StandardCharsets.UTF_8);
        System.out.println("Running " + scriptPath.getFileName() + " on " + database + " ...");

        try (Connection connection = DriverManager.getConnection(jdbcUrl(host, port, database), user, password);
                Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static String jdbcUrl(String host, String port, String database) {
        StringBuilder url = new StringBuilder("jdbc:mariadb://").append(host).append(':').append(port);
        if (database != null && !database.isBlank()) {
            url.append('/').append(database);
        }
        url.append("?allowMultiQueries=true&useUnicode=true&characterEncoding=utf8");
        return url.toString();
    }

    private static String env(String key, String defaultValue) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
