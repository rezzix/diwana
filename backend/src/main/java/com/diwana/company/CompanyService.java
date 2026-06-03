package com.diwana.company;

import com.diwana.common.exception.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public Company getById(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Company", id));
    }

    @Transactional
    public Company update(Long id, CompanyDto.UpdateRequest request) {
        Company company = getById(id);

        if (request.name() != null) company.setName(request.name());
        if (request.description() != null) company.setDescription(request.description());
        if (request.ice() != null) company.setIce(request.ice());
        if (request.rc() != null) company.setRc(request.rc());
        if (request.nif() != null) company.setNif(request.nif());
        if (request.vatNumber() != null) company.setVatNumber(request.vatNumber());
        if (request.address() != null) company.setAddress(request.address());
        if (request.phone() != null) company.setPhone(request.phone());
        if (request.email() != null) company.setEmail(request.email());
        if (request.bankName() != null) company.setBankName(request.bankName());
        if (request.bankIban() != null) company.setBankIban(request.bankIban());
        if (request.bankSwift() != null) company.setBankSwift(request.bankSwift());
        if (request.customsCode() != null) company.setCustomsCode(request.customsCode());

        return companyRepository.save(company);
    }
}
