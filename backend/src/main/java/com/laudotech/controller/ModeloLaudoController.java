package com.laudotech.controller;

import com.laudotech.dto.ModeloLaudoDto;
import com.laudotech.dto.ModeloLaudoRequest;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.FileStorageService;
import com.laudotech.service.ModeloLaudoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/modelos")
@RequiredArgsConstructor
public class ModeloLaudoController {
    private final ModeloLaudoService service;
    private final FileStorageService fileStorageService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<ModeloLaudoDto>> listar() {
        return ResponseEntity.ok(service.listar(auth()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ModeloLaudoDto> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscar(id, auth()));
    }

    @PostMapping
    public ResponseEntity<ModeloLaudoDto> criar(@Valid @RequestBody ModeloLaudoRequest req) {
        return ResponseEntity.ok(service.criar(auth(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ModeloLaudoDto> atualizar(@PathVariable Long id, @Valid @RequestBody ModeloLaudoRequest req) {
        return ResponseEntity.ok(service.atualizar(id, auth(), req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id, auth());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/topicos/imagens")
    public ResponseEntity<Map<String, String>> uploadImagemTopico(@PathVariable Long id,
                                                                    @RequestParam("file") MultipartFile file) {
        service.assertAcessoParaUpload(id, auth());
        String url = fileStorageService.upload(file, "modelos/" + id + "/topicos");
        return ResponseEntity.ok(Map.of("url", url));
    }
}
