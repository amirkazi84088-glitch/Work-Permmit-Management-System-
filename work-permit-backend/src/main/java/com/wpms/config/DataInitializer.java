package com.wpms.config;

import com.wpms.entity.PermitChecklist;
import com.wpms.entity.PermitType;
import com.wpms.entity.Role;
import com.wpms.entity.RoleType;
import com.wpms.entity.User;
import com.wpms.entity.UserRole;
import com.wpms.repository.PermitChecklistRepository;
import com.wpms.repository.PermitTypeRepository;
import com.wpms.repository.RoleRepository;
import com.wpms.repository.UserRepository;
import com.wpms.repository.UserRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedData(
            RoleRepository roleRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            PermitTypeRepository permitTypeRepository,
            PermitChecklistRepository permitChecklistRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            for (RoleType roleType : RoleType.values()) {
                roleRepository.findByRoleName(roleType)
                        .orElseGet(() -> {
                            Role role = new Role();
                            role.setRoleName(roleType);
                            role.setDescription(roleType.name().replace('_', ' '));
                            return roleRepository.save(role);
                        });
            }

            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Test Worker", "worker@test.com", RoleType.WORKER);
            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Supervisor User", "supervisor@test.com", RoleType.SUPERVISOR);
            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Safety Officer User", "safety@test.com", RoleType.SAFETY_OFFICER);
            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Permit Approver User", "approver@test.com", RoleType.PERMIT_APPROVER);
            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Admin User", "admin@test.com", RoleType.ADMIN);
            ensureUserWithRole(userRepository, roleRepository, userRoleRepository, passwordEncoder,
                    "Super Admin User", "superadmin@test.com", RoleType.SUPER_ADMIN);

            Map<String, List<String>> permitTypeSeed = Map.of(
                    "Hot Work", List.of("Fire extinguisher available", "Area gas tested", "Spark shield installed"),
                    "Cold Work", List.of("Tools inspected", "Area isolated", "Supervisor briefing completed"),
                    "Confined Space", List.of("Atmosphere tested", "Rescue plan ready", "Attendant assigned"),
                    "Height Work", List.of("Full body harness checked", "Lifeline secured", "Scaffold inspected"),
                    "Electrical", List.of("LOTO applied", "Voltage verified", "Insulated PPE used"),
                    "Chemical", List.of("MSDS reviewed", "Spill kit ready", "Chemical PPE verified")
            );

            for (Map.Entry<String, List<String>> entry : permitTypeSeed.entrySet()) {
                PermitType permitType = permitTypeRepository.findByName(entry.getKey())
                        .orElseGet(() -> {
                            PermitType type = new PermitType();
                            type.setName(entry.getKey());
                            type.setDescription(entry.getKey() + " permit");
                            return permitTypeRepository.save(type);
                        });

                for (String checklistItem : entry.getValue()) {
                    boolean exists = permitChecklistRepository.findByPermitTypeId(permitType.getId()).stream()
                            .anyMatch(item -> item.getChecklistItem().equalsIgnoreCase(checklistItem));
                    if (!exists) {
                        PermitChecklist checklist = new PermitChecklist();
                        checklist.setPermitType(permitType);
                        checklist.setChecklistItem(checklistItem);
                        checklist.setMandatory(true);
                        permitChecklistRepository.save(checklist);
                    }
                }
            }
        };
    }

    private void ensureUserWithRole(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            String name,
            String email,
            RoleType roleType
    ) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    return newUser;
                });

        user.setName(name);
        user.setPassword(passwordEncoder.encode("Test@1234"));
        user.setIsActive(true);
        user = userRepository.save(user);

        Role role = roleRepository.findByRoleName(roleType).orElseThrow();
        if (!userRoleRepository.existsByUserIdAndRoleId(user.getId(), role.getId())) {
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRole.setPrimaryRole(true);
            userRoleRepository.save(userRole);
        }
    }
}
