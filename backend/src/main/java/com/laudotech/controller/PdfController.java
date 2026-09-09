package com.laudotech.controller;

import com.laudotech.entity.Engenheiro;
import com.laudotech.service.LaudoService;
import com.laudotech.service.PdfGeneratorService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/laudos")
@RequiredArgsConstructor
public class PdfController {
    private final PdfGeneratorService pdfService;
    private final LaudoService laudoService;

    private Engenheiro auth() {
        return (Engenheiro) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // Writes straight to the response's OutputStream (see PdfGeneratorService.generate)
    // instead of building a ResponseEntity<byte[]>, so the whole PDF never needs to sit
    // in memory as one big array.
    @GetMapping("/{id}/pdf")
    public void downloadPdf(@PathVariable Long id, HttpServletResponse response) throws IOException {
        laudoService.assertAcesso(id, auth());
        response.setContentType(MediaType.APPLICATION_PDF_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"laudo-" + id + ".pdf\"");
        pdfService.generate(id, response.getOutputStream());
    }

    @GetMapping("/{id}/preview-pdf")
    public void previewPdf(@PathVariable Long id, HttpServletResponse response) throws IOException {
        laudoService.assertAcesso(id, auth());
        response.setContentType(MediaType.APPLICATION_PDF_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"laudo-" + id + ".pdf\"");
        pdfService.generate(id, response.getOutputStream());
    }
}
