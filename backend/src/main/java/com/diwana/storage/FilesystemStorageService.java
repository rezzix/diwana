package com.diwana.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FilesystemStorageService implements StorageService {

    private final Path basePath;

    public FilesystemStorageService(@Value("${storage.filesystem.base-path:./data/attachments}") String basePath) {
        this.basePath = Paths.get(basePath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.basePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directory: " + this.basePath, e);
        }
    }

    @Override
    public String store(byte[] content, String fileName, String contentType) {
        String uniqueName = UUID.randomUUID() + "_" + fileName;
        Path targetPath = basePath.resolve(uniqueName).normalize();
        if (!targetPath.startsWith(basePath)) {
            throw new RuntimeException("Path traversal detected");
        }
        try {
            Files.write(targetPath, content);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + fileName, e);
        }
        return uniqueName;
    }

    @Override
    public Resource load(String path) {
        try {
            Path file = basePath.resolve(path).normalize();
            if (!file.startsWith(basePath)) {
                throw new RuntimeException("Path traversal detected");
            }
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new RuntimeException("Could not read file: " + path);
        } catch (IOException e) {
            throw new RuntimeException("Could not read file: " + path, e);
        }
    }

    @Override
    public void delete(String path) {
        try {
            Path file = basePath.resolve(path).normalize();
            if (!file.startsWith(basePath)) {
                throw new RuntimeException("Path traversal detected");
            }
            Files.deleteIfExists(file);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file: " + path, e);
        }
    }
}
