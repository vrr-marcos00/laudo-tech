package com.laudotech.config;

import io.minio.MinioClient;
import okhttp3.Dispatcher;
import okhttp3.OkHttpClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class MinioConfig {
    @Value("${app.minio.endpoint}") private String endpoint;
    @Value("${app.minio.access-key}") private String accessKey;
    @Value("${app.minio.secret-key}") private String secretKey;

    @Bean
    public MinioClient minioClient() {
        // OkHttp's default Dispatcher caps concurrent requests at 5 per host, which
        // silently bottlenecked PDF generation to 5-way concurrency against the storage
        // bucket regardless of how many application threads (imageExecutor) tried to
        // fetch photos at once — every extra thread just queued behind that cap.
        Dispatcher dispatcher = new Dispatcher();
        dispatcher.setMaxRequests(64);
        dispatcher.setMaxRequestsPerHost(32);

        OkHttpClient httpClient = new OkHttpClient.Builder()
                .dispatcher(dispatcher)
                .connectTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();

        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .httpClient(httpClient)
                .build();
    }
}
