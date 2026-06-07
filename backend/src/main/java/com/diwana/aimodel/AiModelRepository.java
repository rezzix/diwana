package com.diwana.aimodel;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiModelRepository extends JpaRepository<AiModel, Long> {
    List<AiModel> findAllByOrderByProviderAsc();
}
