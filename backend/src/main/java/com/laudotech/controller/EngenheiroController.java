package com.laudotech.controller;

import com.laudotech.dto.EngenheiroDto;
import com.laudotech.dto.EngenheiroRequest;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.EngenheiroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/engenheiros")
@RequiredArgsConstructor
public class EngenheiroController {
    private final EngenheiroService service;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EngenheiroDto> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id, auth()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EngenheiroDto> atualizar(@PathVariable Long id, @Valid @RequestBody EngenheiroRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req, auth()));
    }

    @PostMapping("/{id}/logo")
    public ResponseEntity<EngenheiroDto> uploadLogo(@PathVariable Long id, @RequestParam MultipartFile file) {
        return ResponseEntity.ok(service.uploadLogo(id, file, auth()));
    }

    @PostMapping("/{id}/assinatura")
    public ResponseEntity<EngenheiroDto> uploadAssinatura(@PathVariable Long id, @RequestParam MultipartFile file) {
        return ResponseEntity.ok(service.uploadAssinatura(id, file, auth()));
    }
}
