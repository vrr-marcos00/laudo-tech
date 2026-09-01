package com.laudotech.controller;

import com.laudotech.dto.NrCatalogoDto;
import com.laudotech.dto.NrCatalogoRequest;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.NrCatalogoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/nrs")
@RequiredArgsConstructor
public class NrCatalogoController {
    private final NrCatalogoService service;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<NrCatalogoDto>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String prioridade) {
        return ResponseEntity.ok(service.listar(auth(), search, prioridade));
    }

    @PostMapping
    public ResponseEntity<NrCatalogoDto> criar(@Valid @RequestBody NrCatalogoRequest req) {
        return ResponseEntity.ok(service.criar(auth(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NrCatalogoDto> atualizar(@PathVariable Long id, @Valid @RequestBody NrCatalogoRequest req) {
        return ResponseEntity.ok(service.atualizar(id, auth(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id, auth());
        return ResponseEntity.noContent().build();
    }
}
