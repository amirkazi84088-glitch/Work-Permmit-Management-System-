package com.wpms.controller;

import com.wpms.entity.Permit;
import com.wpms.entity.PermitType;
import com.wpms.repository.PermitChecklistRepository;
import com.wpms.repository.PermitRepository;
import com.wpms.repository.PermitTypeRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN','SUPERVISOR','SAFETY_OFFICER','PERMIT_APPROVER')")
public class ReportController {

    private final PermitRepository permitRepository;
    private final PermitTypeRepository permitTypeRepository;
    private final PermitChecklistRepository permitChecklistRepository;

    public ReportController(
            PermitRepository permitRepository,
            PermitTypeRepository permitTypeRepository,
            PermitChecklistRepository permitChecklistRepository
    ) {
        this.permitRepository = permitRepository;
        this.permitTypeRepository = permitTypeRepository;
        this.permitChecklistRepository = permitChecklistRepository;
    }

    @GetMapping("/permits")
    public List<Map<String, Object>> getPermitTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        return permitRepository.findBySubmittedAtBetweenOrderBySubmittedAtAsc(start, end).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        permit -> permit.getSubmittedAt().toLocalDate(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.counting()
                ))
                .entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", entry.getKey());
                    row.put("count", entry.getValue());
                    return row;
                })
                .toList();
    }

    @GetMapping("/types")
    public List<Map<String, Object>> getPermitTypeDistribution() {
        List<Permit> permits = permitRepository.findAll();
        return permitTypeRepository.findAll().stream()
                .map(type -> {
                    long count = permits.stream()
                            .filter(permit -> permit.getPermitType().getId().equals(type.getId()))
                            .count();
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("permitTypeId", type.getId());
                    row.put("name", type.getName());
                    row.put("description", type.getDescription());
                    row.put("checklistCount", permitChecklistRepository.findByPermitTypeId(type.getId()).size());
                    row.put("permitCount", count);
                    return row;
                })
                .toList();
    }
}
