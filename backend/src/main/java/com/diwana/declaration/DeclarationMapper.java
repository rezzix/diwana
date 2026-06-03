package com.diwana.declaration;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DeclarationMapper {

    @Mapping(target = "declarantName", expression = "java(declaration.getDeclarant().getFirstName() + \" \" + declaration.getDeclarant().getLastName())")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "createdAt", source = "createdAt", dateFormat = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    DeclarationDto toDto(Declaration declaration);

    List<DeclarationDto> toDtoList(List<Declaration> declarations);

    DeclarationDto.LineItemDto toLineItemDto(DeclarationLineItem item);

    List<DeclarationDto.LineItemDto> toLineItemDtoList(List<DeclarationLineItem> items);
}
