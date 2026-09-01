package com.laudotech.controller;

import com.laudotech.dto.FotoDto;
import com.laudotech.dto.PontoAnotacaoDto;
import com.laudotech.entity.Engenheiro;
import com.laudotech.service.FotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FotoController {
    private final FotoService fotoService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/areas/{areaId}/fotos")
    public ResponseEntity<FotoDto> upload(@PathVariable Long areaId, @RequestParam MultipartFile file) {
        return ResponseEntity.ok(fotoService.upload(areaId, file, auth()));
    }

    @DeleteMapping("/fotos/{fotoId}")
    public ResponseEntity<Void> deletar(@PathVariable Long fotoId) {
        fotoService.deletar(fotoId, auth());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/fotos/{fotoId}/pontos")
    public ResponseEntity<List<PontoAnotacaoDto>> listarPontos(@PathVariable Long fotoId) {
        return ResponseEntity.ok(fotoService.listarPontos(fotoId, auth()));
    }

    @PostMapping("/fotos/{fotoId}/pontos")
    public ResponseEntity<List<PontoAnotacaoDto>> salvarPontos(@PathVariable Long fotoId,
                                                                @RequestBody List<PontoAnotacaoDto> pontos) {
        return ResponseEntity.ok(fotoService.salvarPontos(fotoId, pontos, auth()));
    }
}
