package com.diwana.documenttype;

import com.diwana.common.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DocumentTypeService {

    private final DocumentTypeRepository documentTypeRepository;

    public DocumentTypeService(DocumentTypeRepository documentTypeRepository) {
        this.documentTypeRepository = documentTypeRepository;
    }

    @Transactional(readOnly = true)
    public List<DocumentType> listAll() {
        return documentTypeRepository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<DocumentType> listActive() {
        return documentTypeRepository.findAllByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public DocumentType getById(Long id) {
        return documentTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("DocumentType", id));
    }

    @Transactional
    public DocumentType create(DocumentTypeDto.CreateRequest request) {
        if (documentTypeRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Document type code already exists: " + request.code());
        }
        DocumentType docType = new DocumentType();
        docType.setCode(request.code());
        docType.setName(request.name());
        docType.setDescription(request.description());
        docType.setActive(true);
        return documentTypeRepository.save(docType);
    }

    @Transactional
    public DocumentType update(Long id, DocumentTypeDto.UpdateRequest request) {
        DocumentType docType = getById(id);

        // Check code uniqueness if changed
        if (!docType.getCode().equals(request.code()) && documentTypeRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Document type code already exists: " + request.code());
        }

        docType.setCode(request.code());
        docType.setName(request.name());
        docType.setDescription(request.description());
        if (request.active() != null) {
            docType.setActive(request.active());
        }
        return documentTypeRepository.save(docType);
    }

    @Transactional
    public void delete(Long id) {
        DocumentType docType = getById(id);
        docType.setActive(false);
        documentTypeRepository.save(docType);
    }

    @Transactional(readOnly = true)
    public DocumentType findByCode(String code) {
        return documentTypeRepository.findByCode(code).orElse(null);
    }
}