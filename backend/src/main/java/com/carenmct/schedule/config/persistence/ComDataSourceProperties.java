package com.carenmct.schedule.config.persistence;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.datasource.com")
public class ComDataSourceProperties {

    private String jdbcUrl;
    private String username;
    private String password;
    private String driverClassName = "org.mariadb.jdbc.Driver";
}
