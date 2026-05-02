package com.wpms.controller;

import com.wpms.dto.PermitTypeResponseDTO;
import com.wpms.service.PermitTypeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permit-types")
public class PermitTypeController {

    private final PermitTypeService permitTypeService;

    public PermitTypeController(PermitTypeService permitTypeService) {
        this.permitTypeService = permitTypeService;
    }

    @GetMapping
    public List<PermitTypeResponseDTO> getAllPermitTypes() {
        return permitTypeService.getAllPermitTypes();
    }
}
