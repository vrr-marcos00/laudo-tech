package com.laudotech.controller;

import com.laudotech.dto.*;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.AreaInspecaoService;
import com.laudotech.service.FileStorageService;
import com.laudotech.service.LaudoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1/laudos")
@RequiredArgsConstructor
public class LaudoController {
    private final LaudoService laudoService;
    private final AreaInspecaoService areaService;
    private final FileStorageService fileStorageService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<LaudoDto>> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long clienteId) {
        return ResponseEntity.ok(laudoService.listar(status, clienteId, auth()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaudoDto> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(laudoService.buscar(id, auth()));
    }

    @PostMapping
    public ResponseEntity<LaudoDto> criar(@Valid @RequestBody LaudoRequest req) {
        return ResponseEntity.ok(laudoService.criar(req, auth()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaudoDto> atualizar(@PathVariable Long id, @RequestBody LaudoRequest req) {
        return ResponseEntity.ok(laudoService.atualizar(id, req, auth()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        laudoService.deletar(id, auth());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LaudoDto> mudarStatus(@PathVariable Long id, @RequestBody StatusRequest req) {
        return ResponseEntity.ok(laudoService.mudarStatus(id, req.getStatus(), req.getObservacao(), auth()));
    }

    @PostMapping("/{id}/nova-versao")
    public ResponseEntity<LaudoDto> criarNovaVersao(@PathVariable Long id) {
        return ResponseEntity.ok(laudoService.criarNovaVersao(id, auth()));
    }

    @PutMapping("/{id}/topicos")
    public ResponseEntity<LaudoDto> salvarTopicos(@PathVariable Long id, @RequestBody List<LaudoTopicoDto> topicos) {
        return ResponseEntity.ok(laudoService.salvarTopicos(id, topicos, auth()));
    }

    // Áreas
    @GetMapping("/{id}/areas")
    public ResponseEntity<List<AreaInspecaoDto>> listarAreas(@PathVariable Long id) {
        return ResponseEntity.ok(areaService.listar(id, auth()));
    }

    @PostMapping("/{id}/areas")
    public ResponseEntity<AreaInspecaoDto> criarArea(@PathVariable Long id, @Valid @RequestBody AreaInspecaoRequest req) {
        return ResponseEntity.ok(areaService.criar(id, req, auth()));
    }

    @PutMapping("/{laudoId}/areas/{areaId}")
    public ResponseEntity<AreaInspecaoDto> atualizarArea(@PathVariable Long laudoId, @PathVariable Long areaId,
                                                          @RequestBody AreaInspecaoRequest req) {
        return ResponseEntity.ok(areaService.atualizar(areaId, req, auth()));
    }

    @DeleteMapping("/{laudoId}/areas/{areaId}")
    public ResponseEntity<Void> deletarArea(@PathVariable Long laudoId, @PathVariable Long areaId) {
        areaService.deletar(areaId, auth());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/logo-capa")
    public ResponseEntity<LaudoDto> uploadLogoCapa(@PathVariable Long id,
                                                    @RequestParam("file") MultipartFile file) {
        String url = fileStorageService.upload(file, "laudos/" + id + "/logo");
        return ResponseEntity.ok(laudoService.atualizarLogoCapa(id, url, auth()));
    }

    @DeleteMapping("/{id}/logo-capa")
    public ResponseEntity<LaudoDto> removerLogoCapa(@PathVariable Long id) {
        return ResponseEntity.ok(laudoService.atualizarLogoCapa(id, null, auth()));
    }
}
