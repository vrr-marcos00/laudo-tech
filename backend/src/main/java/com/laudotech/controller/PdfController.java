package com.laudotech.controller;

import com.laudotech.entity.Engenheiro;
import com.laudotech.service.LaudoService;
import com.laudotech.service.PdfGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/laudos")
@RequiredArgsConstructor
public class PdfController {
    private final PdfGeneratorService pdfService;
    private final LaudoService laudoService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long id) {
        laudoService.assertAcesso(id, auth());
        byte[] pdf = pdfService.generate(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"laudo-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}/preview-pdf")
    public ResponseEntity<byte[]> previewPdf(@PathVariable Long id) {
        laudoService.assertAcesso(id, auth());
        byte[] pdf = pdfService.generate(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"laudo-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
