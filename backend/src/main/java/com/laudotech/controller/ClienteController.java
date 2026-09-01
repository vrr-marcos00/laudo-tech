package com.laudotech.controller;

import com.laudotech.dto.ClienteDto;
import com.laudotech.dto.ClienteRequest;
import com.laudotech.dto.LaudoDto;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.ClienteService;
import com.laudotech.service.LaudoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {
    private final ClienteService service;
    private final LaudoService laudoService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<ClienteDto>> listar(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.listar(search, auth()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDto> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id, auth()));
    }

    @PostMapping
    public ResponseEntity<ClienteDto> criar(@Valid @RequestBody ClienteRequest req) {
        return ResponseEntity.ok(service.criar(req, auth()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteDto> atualizar(@PathVariable Long id, @Valid @RequestBody ClienteRequest req) {
        return ResponseEntity.ok(service.atualizar(id, req, auth()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id, auth());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/foto")
    public ResponseEntity<ClienteDto> uploadFoto(@PathVariable Long id, @RequestParam MultipartFile file) {
        return ResponseEntity.ok(service.uploadFoto(id, file, auth()));
    }

    @GetMapping("/{id}/laudos")
    public ResponseEntity<List<LaudoDto>> listarLaudos(@PathVariable Long id) {
        return ResponseEntity.ok(laudoService.listarPorCliente(id, auth()));
    }
}
