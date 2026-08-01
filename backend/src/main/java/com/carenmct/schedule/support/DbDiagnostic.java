package com.carenmct.schedule.support;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/** DB 스키마 진단 — {@code ./gradlew diagnoseDb} */
public final class DbDiagnostic {

    private DbDiagnostic() {}

    public static void main(String[] args) throws SQLException {
        String host = env("DB_HOST", "localhost");
        String port = env("DB_PORT", "3306");
        String user = env("DB_USER", "root");
        String password = env("DB_PASSWORD", "root");

        printDb("carenmct_com", host, port, user, password, "facilities");
        printDb("carenmct_com", host, port, user, password, "users");
        printDb("carenmct_schedule", host, port, user, password, "sch_service_schedules");
        printSeedCount(host, port, user, password);
        printReferenceSeedCount(host, port, user, password);
    }

    private static void printReferenceSeedCount(String host, String port, String user, String password)
            throws SQLException {
        String url =
                "jdbc:mariadb://" + host + ":" + port + "/carenmct_schedule?useUnicode=true&characterEncoding=utf8";
        try (Connection connection = DriverManager.getConnection(url, user, password);
                Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery(
                    "SELECT COUNT(*) FROM sch_annual_benefit_limits WHERE note LIKE 'dev_seed%'")) {
                if (rs.next()) {
                    System.out.println("=== dev_seed benefit_limits ===");
                    System.out.println(rs.getInt(1));
                }
            }
            try (ResultSet rs = statement.executeQuery(
                    "SELECT COUNT(*) FROM sch_annual_fee_rate_services WHERE note = 'dev_seed'")) {
                if (rs.next()) {
                    System.out.println("=== dev_seed fee_rate_services ===");
                    System.out.println(rs.getInt(1));
                }
            }
            try (ResultSet rs = statement.executeQuery(
                    """
                    SELECT COUNT(*)
                    FROM sch_annual_fee_rate_items i
                    INNER JOIN sch_annual_fee_rate_services s ON s.id = i.fee_rate_service_id
                    WHERE s.note = 'dev_seed'
                    """)) {
                if (rs.next()) {
                    System.out.println("=== dev_seed fee_rate_items ===");
                    System.out.println(rs.getInt(1));
                    System.out.println();
                }
            }
        } catch (SQLException ex) {
            System.out.println("reference seed count: " + ex.getMessage());
        }
    }

    private static void printSeedCount(String host, String port, String user, String password)
            throws SQLException {
        String url =
                "jdbc:mariadb://" + host + ":" + port + "/carenmct_schedule?useUnicode=true&characterEncoding=utf8";
        try (Connection connection = DriverManager.getConnection(url, user, password);
                Statement statement = connection.createStatement();
                ResultSet rs =
                        statement.executeQuery(
                                "SELECT COUNT(*) FROM sch_service_schedules WHERE source = 'dev_seed'")) {
            if (rs.next()) {
                System.out.println("=== dev_seed row count ===");
                System.out.println(rs.getInt(1));
                System.out.println();
            }
        } catch (SQLException ex) {
            System.out.println("dev_seed count: (sch_service_schedules missing) " + ex.getMessage());
        }
    }

    private static void printDb(
            String database, String host, String port, String user, String password, String table)
            throws SQLException {
        String url =
                "jdbc:mariadb://" + host + ":" + port + "/" + database + "?useUnicode=true&characterEncoding=utf8";
        System.out.println("=== " + database + "." + table + " ===");
        try (Connection connection = DriverManager.getConnection(url, user, password);
                Statement statement = connection.createStatement()) {
            try (ResultSet rs = statement.executeQuery("SHOW CREATE TABLE " + table)) {
                if (rs.next()) {
                    System.out.println(rs.getString(2));
                }
            } catch (SQLException ex) {
                System.out.println("(table missing) " + ex.getMessage());
            }
            try (ResultSet rs = statement.executeQuery(
                    "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME"
                            + " FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '"
                            + database
                            + "'")) {
                if (rs.next()) {
                    System.out.println(
                            "DB charset: " + rs.getString(1) + ", collation: " + rs.getString(2));
                }
            }
        }
        System.out.println();
    }

    private static String env(String key, String defaultValue) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
