package com.laudotech.service;

import io.minio.*;
import io.minio.errors.MinioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {
    private final MinioClient minioClient;

    @Value("${app.minio.bucket}")
    private String bucket;

    @Value("${app.minio.public-url}")
    private String publicUrl;

    public String upload(MultipartFile file, String folder) {
        try {
            ensureBucket();
            String ext = getExtension(file.getOriginalFilename());
            String objectName = folder + "/" + UUID.randomUUID() + ext;
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
            return publicUrl + "/" + objectName;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload do arquivo: " + e.getMessage(), e);
        }
    }

    public byte[] downloadBytes(String url) throws Exception {
        String objectName = url.replace(publicUrl + "/", "");
        try (InputStream is = minioClient.getObject(
                io.minio.GetObjectArgs.builder().bucket(bucket).object(objectName).build())) {
            return is.readAllBytes();
        }
    }

    public void delete(String url) {
        try {
            String objectName = url.replace(publicUrl + "/", "");
            minioClient.removeObject(RemoveObjectArgs.builder().bucket(bucket).object(objectName).build());
        } catch (Exception e) {
            log.warn("Erro ao deletar arquivo do MinIO: {}", e.getMessage());
        }
    }

    private void ensureBucket() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            // Make bucket public for reading. Not all S3-compatible providers support
            // bucket policies (e.g. Cloudflare R2), so this is best-effort: public read
            // access must be configured manually on those providers (dashboard/custom domain).
            try {
                String policy = """
                        {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}
                        """.formatted(bucket);
                minioClient.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
            } catch (Exception e) {
                log.warn("Nao foi possivel definir a bucket policy (provedor pode nao suportar): {}", e.getMessage());
            }
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx) : "";
    }
}
