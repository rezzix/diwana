package com.diwana.tariff;

import com.diwana.common.exception.EntityNotFoundException;
import com.diwana.origin.Origin;
import com.diwana.origin.OriginRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TariffRateService {

    private final TariffRateRepository tariffRateRepository;
    private final OriginRepository originRepository;

    public TariffRateService(TariffRateRepository tariffRateRepository, OriginRepository originRepository) {
        this.tariffRateRepository = tariffRateRepository;
        this.originRepository = originRepository;
    }

    @Transactional(readOnly = true)
    public List<TariffRate> listAll() {
        return tariffRateRepository.findAllByOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public List<TariffRate> listActive() {
        return tariffRateRepository.findAllByActiveTrueOrderByIdAsc();
    }

    @Transactional(readOnly = true)
    public TariffRate getById(Long id) {
        return tariffRateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TariffRate", id));
    }

    @Transactional
    public TariffRate create(TariffRateDto.CreateRequest request) {
        Origin origin = resolveOrigin(request.originCode());

        // Check uniqueness: same origin + same HS code
        if (origin != null && tariffRateRepository.findByOriginAndHsCodeAndActiveTrue(origin, request.hsCode()) != null) {
            throw new IllegalArgumentException("Tariff rate already exists for origin=" + request.originCode() + " hsCode=" + request.hsCode());
        }

        TariffRate rate = new TariffRate();
        rate.setOrigin(origin);
        rate.setHsCode(request.hsCode());
        rate.setDescription(request.description());
        rate.setDutyRate(request.dutyRate());
        rate.setVatRate(request.vatRate());
        rate.setUnit(request.unit());
        rate.setActive(true);
        return tariffRateRepository.save(rate);
    }

    @Transactional
    public TariffRate update(Long id, TariffRateDto.UpdateRequest request) {
        TariffRate rate = getById(id);
        Origin origin = resolveOrigin(request.originCode());

        rate.setOrigin(origin);
        rate.setHsCode(request.hsCode());
        rate.setDescription(request.description());
        rate.setDutyRate(request.dutyRate());
        rate.setVatRate(request.vatRate());
        rate.setUnit(request.unit());
        if (request.active() != null) {
            rate.setActive(request.active());
        }
        return tariffRateRepository.save(rate);
    }

    @Transactional
    public void deactivate(Long id) {
        TariffRate rate = getById(id);
        rate.setActive(false);
        tariffRateRepository.save(rate);
    }

    private Origin resolveOrigin(String originCode) {
        if (originCode == null || originCode.isBlank()) return null;
        return originRepository.findByCode(originCode)
                .orElseThrow(() -> new EntityNotFoundException("Origin not found with code: " + originCode));
    }
}