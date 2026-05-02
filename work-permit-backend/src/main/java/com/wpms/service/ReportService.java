package com.wpms.service;

import com.wpms.entity.Permit;
import com.wpms.entity.PermitChecklist;
import com.wpms.entity.PermitType;
import com.wpms.repository.PermitChecklistRepository;
import com.wpms.repository.PermitRepository;
import com.wpms.repository.PermitTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final PermitRepository permitRepository;
    private final PermitTypeRepository permitTypeRepository;
    private final PermitChecklistRepository permitChecklistRepository;

    public ReportService(
            PermitRepository permitRepository,
            PermitTypeRepository permitTypeRepository,
            PermitChecklistRepository permitChecklistRepository
    ) {
        this.permitRepository = permitRepository;
        this.permitTypeRepository = permitTypeRepository;
        this.permitChecklistRepository = permitChecklistRepository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPermitTrend(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            startDate = LocalDate.now().minusDays(7);
            endDate = LocalDate.now();
        }

        List<Permit> permits = permitRepository.findBySubmittedAtBetweenOrderBySubmittedAtAsc(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay()
        );

        Map<LocalDate, Long> counts = new LinkedHashMap<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            counts.put(date, 0L);
        }
        for (Permit permit : permits) {
            LocalDate date = permit.getSubmittedAt().toLocalDate();
            counts.computeIfPresent(date, (d, c) -> c + 1);
        }

        return counts.entrySet().stream()
                .map(entry -> Map.<String, Object>of("date", entry.getKey().toString(), "count", entry.getValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPermitTypeDistribution() {
        return permitTypeRepository.findAll().stream()
                .map(type -> Map.<String, Object>of(
                        "name", type.getName(),
                        "count", permitRepository.findAll().stream().filter(p -> p.getPermitType().getId().equals(type.getId())).count(),
                        "checklistCount", permitChecklistRepository.findByPermitTypeId(type.getId()).size()
                ))
                .toList();
    }
}
