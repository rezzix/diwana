package com.diwana.user;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "companyName", source = "company.name")
    @Mapping(target = "customsOfficeId", source = "customsOffice.id")
    @Mapping(target = "customsOfficeName", source = "customsOffice.name")
    UserDto toDto(User user);

    List<UserDto> toDtoList(List<User> users);
}