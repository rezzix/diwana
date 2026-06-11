package com.diwana.aimodel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AiModelRepository extends JpaRepository<AiModel, Long> {
    @Query("SELECT m FROM AiModel m ORDER BY m.callOrder ASC NULLS LAST, m.provider ASC")
    List<AiModel> findAllOrdered();
    List<AiModel> findByActiveTrueAndTypeAndCallOrderIsNotNullOrderByCallOrderAsc(String type);
}
