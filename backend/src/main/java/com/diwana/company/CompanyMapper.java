package com.diwana.company;

import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    CompanyDto toDto(Company company);

    List<CompanyDto> toDtoList(List<Company> companies);
}
