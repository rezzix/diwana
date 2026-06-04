package com.diwana.storage;

import org.springframework.core.io.Resource;

public interface StorageService {

    String store(byte[] content, String fileName, String contentType);

    Resource load(String path);

    void delete(String path);
}
