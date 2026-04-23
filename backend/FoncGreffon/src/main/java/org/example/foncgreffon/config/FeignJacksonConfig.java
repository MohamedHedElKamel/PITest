package org.example.foncgreffon.config;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.codec.Decoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignJacksonConfig {

    @Autowired
    private ObjectMapper objectMapper;

    @Bean
    public Decoder feignDecoder() {
        return (response, type) -> {
            if (response.body() == null) return null;
            JavaType javaType = objectMapper.getTypeFactory().constructType(type);
            return objectMapper.readValue(response.body().asInputStream(), javaType);
        };
    }
}
