package org.example.foncgreffon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class FoncGreffonApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoncGreffonApplication.class, args);
    }

}
