package com.wpms.service;

import com.wpms.dto.PermitTypeResponseDTO;
import com.wpms.entity.PermitChecklist;
import com.wpms.entity.PermitType;
import com.wpms.repository.PermitChecklistRepository;
import com.wpms.repository.PermitTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PermitTypeService {

    private final PermitTypeRepository permitTypeRepository;
    private final PermitChecklistRepository permitChecklistRepository;

    public PermitTypeService(PermitTypeRepository permitTypeRepository, PermitChecklistRepository permitChecklistRepository) {
        this.permitTypeRepository = permitTypeRepository;
        this.permitChecklistRepository = permitChecklistRepository;
    }

    @Transactional(readOnly = true)
    public List<PermitTypeResponseDTO> getAllPermitTypes() {
        return permitTypeRepository.findAll().stream()
                .map(this::mapToDto)
                .toList();
    }

    private PermitTypeResponseDTO mapToDto(PermitType permitType) {
        List<String> checklistItems = permitChecklistRepository.findByPermitTypeId(permitType.getId()).stream()
                .map(PermitChecklist::getChecklistItem)
                .toList();

        PermitTypeResponseDTO dto = new PermitTypeResponseDTO();
        dto.setId(permitType.getId());
        dto.setName(permitType.getName());
        dto.setDescription(permitType.getDescription());
        dto.setChecklistItems(checklistItems);
        return dto;
    }
}
