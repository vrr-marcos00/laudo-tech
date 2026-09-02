package com.laudotech.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.events.Event;
import com.itextpdf.kernel.events.IEventHandler;
import com.itextpdf.kernel.events.PdfDocumentEvent;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.kernel.pdf.extgstate.PdfExtGState;
import com.itextpdf.layout.Canvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.laudotech.dto.*;
import com.laudotech.entity.*;
import com.laudotech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.util.Map;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.time.format.DateTimeFormatter;
import java.util.List;
import javax.imageio.ImageIO;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGeneratorService {

    private final LaudoRepository laudoRepo;
    private final AreaInspecaoRepository areaRepo;
    private final FotoService fotoService;
    private final LaudoService laudoService;
    private final FileStorageService fileStorageService;

    private static final float MARGIN = 56.7f; // 2cm in points
    private static final DeviceRgb PRIMARY_COLOR = new DeviceRgb(0, 70, 127);
    private static final DeviceRgb HEADER_BG = new DeviceRgb(240, 240, 240);
    private static final DeviceRgb BORDER_COLOR = new DeviceRgb(221, 221, 221);
    private static final DeviceRgb ZEBRA_BG = new DeviceRgb(248, 248, 248);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<String, DeviceRgb> PRIORITY_COLORS_PDF = Map.of(
            "CRITICO", new DeviceRgb(220, 38, 38),
            "ALTO",    new DeviceRgb(234, 88, 12),
            "MEDIO",   new DeviceRgb(202, 138, 4),
            "BAIXO",   new DeviceRgb(37, 99, 235)
    );

    public byte[] generate(Long laudoId) {
        laudoService.ensureTopicosEspeciais(laudoId);
        Laudo laudo = laudoRepo.findById(laudoId)
                .orElseThrow(() -> new RuntimeException("Laudo não encontrado"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            pdf.setDefaultPageSize(PageSize.A4);

            Document doc = new Document(pdf, PageSize.A4);
            doc.setMargins(MARGIN, MARGIN, MARGIN, MARGIN);

            PdfFont fontRegular = PdfFontFactory.createFont("Times-Roman");
            PdfFont fontBold = PdfFontFactory.createFont("Times-Bold");

            // Footer handler
            pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new FooterHandler(laudo, fontRegular));

            // Draft watermark (removed automatically once the laudo is finalized)
            if (laudo.getStatus() != Laudo.Status.FINALIZADO) {
                pdf.addEventHandler(PdfDocumentEvent.END_PAGE, new WatermarkHandler(fontBold));
            }

            // Cover page (optional)
            if (laudo.isMostrarCapa()) {
                addCover(doc, laudo, fontBold, fontRegular);
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }

            // Company cover page (optional)
            if (laudo.isMostrarCapaEmpresa()) {
                addCapaEmpresa(doc, laudo, fontBold, fontRegular);
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }

            // Table of contents (optional)
            if (laudo.isMostrarSumario()) {
                addSummary(doc, laudo, fontBold, fontRegular);
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }

            // Identification section
            addIdentificacao(doc, laudo, fontBold, fontRegular);

            // Company description page (optional)
            if (laudo.isMostrarDescricaoEmpresa()) {
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                addDescricaoEmpresa(doc, laudo, fontBold, fontRegular);
                doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            }

            // Topics (includes Registro Fotográfico / Itens Críticos wherever the user placed them)
            addTopicos(doc, laudo, fontBold, fontRegular);

            // Signature
            addAssinatura(doc, laudo, fontBold, fontRegular);

            doc.close();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar PDF: " + e.getMessage(), e);
        }

        return baos.toByteArray();
    }

    private void addCover(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) throws IOException {
        // Cover logo: prefer laudo-specific logo, fallback to engineer logo
        String logoUrl = laudo.getLogoCapaUrl() != null
                ? laudo.getLogoCapaUrl()
                : laudo.getEngenheiro().getLogoUrl();
        if (logoUrl != null) {
            try {
                byte[] logoBytes = fileStorageService.downloadBytes(logoUrl);
                byte[] logoNorm = normalizeFormat(logoBytes);
                Image logo = new Image(ImageDataFactory.create(logoNorm));
                logo.setWidth(160).setHorizontalAlignment(HorizontalAlignment.CENTER);
                doc.add(logo);
            } catch (Exception e) {
                log.warn("Não foi possível carregar logo da capa: {}", e.getMessage());
            }
        }

        doc.add(new Paragraph("\n\n"));

        // Title
        String titulo = (laudo.getTituloCapa() != null && !laudo.getTituloCapa().isBlank())
                ? laudo.getTituloCapa() : "LAUDO TÉCNICO DAS INSTALAÇÕES ELÉTRICAS";
        String subtitulo = (laudo.getSubtituloCapa() != null && !laudo.getSubtituloCapa().isBlank())
                ? laudo.getSubtituloCapa() : "NR-10";

        doc.add(new Paragraph(titulo)
                .setFont(bold).setFontSize(20).setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph(subtitulo)
                .setFont(bold).setFontSize(16).setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("\n\n\n"));

        // Client info
        doc.add(new Paragraph("EMPRESA: " + laudo.getCliente().getNome())
                .setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER));

        if (laudo.getCliente().getCnpj() != null) {
            doc.add(new Paragraph("CNPJ: " + laudo.getCliente().getCnpj())
                    .setFont(regular).setFontSize(12).setTextAlignment(TextAlignment.CENTER));
        }

        if (laudo.getCliente().getEndereco() != null) {
            doc.add(new Paragraph(laudo.getCliente().getEndereco() +
                    (laudo.getCliente().getCidade() != null ? " - " + laudo.getCliente().getCidade() : ""))
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }

        doc.add(new Paragraph("\n\n\n"));

        // Engineer info
        doc.add(new Paragraph("RESPONSÁVEL TÉCNICO: " + laudo.getEngenheiro().getNome())
                .setFont(bold).setFontSize(12).setTextAlignment(TextAlignment.CENTER));

        doc.add(new Paragraph("REGISTRO CREA: " + laudo.getEngenheiro().getCrea())
                .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));

        if (laudo.getCliente().getCidade() != null && laudo.getDataEmissao() != null) {
            doc.add(new Paragraph(laudo.getCliente().getCidade() + ", " + laudo.getDataEmissao().format(DATE_FMT))
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }
    }

    private void addCapaEmpresa(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) throws IOException {
        String fotoUrl = laudo.getCliente().getFotoUrl();
        if (fotoUrl != null) {
            try {
                byte[] fotoBytes = fileStorageService.downloadBytes(fotoUrl);
                byte[] fotoNorm = normalizeFormat(fotoBytes);
                Image foto = new Image(ImageDataFactory.create(fotoNorm));
                foto.setWidth(200).setHorizontalAlignment(HorizontalAlignment.CENTER);
                doc.add(foto);
            } catch (Exception e) {
                log.warn("Não foi possível carregar a foto da empresa: {}", e.getMessage());
            }
        }

        doc.add(new Paragraph("\n\n"));

        doc.add(new Paragraph(laudo.getCliente().getNome().toUpperCase())
                .setFont(bold).setFontSize(20).setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER));
    }

    private void addDescricaoEmpresa(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) throws IOException {
        String logoUrl = laudo.getCliente().getFotoUrl();
        if (logoUrl != null) {
            try {
                byte[] logoBytes = fileStorageService.downloadBytes(logoUrl);
                byte[] logoNorm = normalizeFormat(logoBytes);
                Image logo = new Image(ImageDataFactory.create(logoNorm));
                logo.setWidth(140).setHorizontalAlignment(HorizontalAlignment.CENTER);
                doc.add(logo);
            } catch (Exception e) {
                log.warn("Não foi possível carregar a foto da empresa: {}", e.getMessage());
            }
        }

        doc.add(new Paragraph(laudo.getCliente().getNome())
                .setFont(bold).setFontSize(16).setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(16).setMarginBottom(16));

        String descricao = laudo.getCliente().getDescricao();
        if (descricao != null && !descricao.isBlank()) {
            doc.add(new Paragraph(descricao)
                    .setFont(regular).setFontSize(11));
        }
    }

    private void addSummary(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) {
        doc.add(new Paragraph("SUMÁRIO")
                .setFont(bold).setFontSize(14).setFontColor(PRIMARY_COLOR)
                .setBorderBottom(new SolidBorder(PRIMARY_COLOR, 1)).setMarginBottom(10));

        List<String> itens = new java.util.ArrayList<>();
        itens.add("IDENTIFICAÇÃO DA EMPRESA");
        for (LaudoTopico t : laudo.getTopicos()) itens.add(t.getTitulo().toUpperCase());
        itens.add("ASSINATURA");

        for (int i = 0; i < itens.size(); i++) {
            doc.add(new Paragraph((i + 1) + ". " + itens.get(i))
                    .setFont(regular).setFontSize(11).setMarginLeft(10));
        }
    }

    private void addIdentificacao(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) {
        addSectionTitle(doc, "1. IDENTIFICAÇÃO DA EMPRESA", bold);

        float[] colWidths = {150f, 300f};
        Table table = new Table(colWidths).useAllAvailableWidth().setMarginBottom(20);

        addTableRow(table, "NOME DA EMPRESA", laudo.getCliente().getNome(), bold, regular);
        if (laudo.getCliente().getCnpj() != null) addTableRow(table, "CNPJ", laudo.getCliente().getCnpj(), bold, regular);
        if (laudo.getCliente().getEndereco() != null) addTableRow(table, "ENDEREÇO", laudo.getCliente().getEndereco(), bold, regular);
        if (laudo.getCliente().getCidade() != null) addTableRow(table, "CIDADE/ESTADO", laudo.getCliente().getCidade() + "/" + laudo.getCliente().getEstado(), bold, regular);
        if (laudo.getDataVisita() != null) addTableRow(table, "DATA DE VISITA", laudo.getDataVisita().format(DATE_FMT), bold, regular);
        if (laudo.getNumeroArt() != null) addTableRow(table, "NÚMERO ART", laudo.getNumeroArt(), bold, regular);
        if (laudo.getQuemAcompanhou() != null) addTableRow(table, "ACOMPANHOU A VISITA", laudo.getQuemAcompanhou(), bold, regular);
        doc.add(table);

        addSectionTitle(doc, "RESPONSÁVEL TÉCNICO", bold);
        Table tEng = new Table(colWidths).useAllAvailableWidth().setMarginBottom(20);
        addTableRow(tEng, "NOME", laudo.getEngenheiro().getNome(), bold, regular);
        addTableRow(tEng, "CREA", laudo.getEngenheiro().getCrea(), bold, regular);
        if (laudo.getEngenheiro().getTituloProfissional() != null) addTableRow(tEng, "TÍTULO", laudo.getEngenheiro().getTituloProfissional(), bold, regular);
        if (laudo.getEngenheiro().getEmail() != null) addTableRow(tEng, "EMAIL", laudo.getEngenheiro().getEmail(), bold, regular);
        if (laudo.getEngenheiro().getTelefone() != null) addTableRow(tEng, "TELEFONE", laudo.getEngenheiro().getTelefone(), bold, regular);
        doc.add(tEng);
    }

    private void addTopicos(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) {
        List<LaudoTopico> topicos = laudo.getTopicos();
        for (int i = 0; i < topicos.size(); i++) {
            LaudoTopico t = topicos.get(i);
            String titulo = (i + 2) + ". " + t.getTitulo().toUpperCase();
            switch (t.getTipo()) {
                case REGISTRO_FOTOGRAFICO -> addRegistroFotografico(doc, laudo, bold, regular, titulo);
                case ITENS_CRITICOS -> addItensCriticos(doc, laudo, bold, regular, titulo);
                default -> {
                    addSectionTitle(doc, titulo, bold);
                    if (t.getConteudo() != null && !t.getConteudo().isBlank()) {
                        doc.add(new Paragraph(t.getConteudo()).setFont(regular).setFontSize(11)
                                .setTextAlignment(TextAlignment.JUSTIFIED).setMarginBottom(15));
                    }
                }
            }
        }
    }

    private void addRegistroFotografico(Document doc, Laudo laudo, PdfFont bold, PdfFont regular, String titulo) {
        addSectionTitle(doc, titulo, bold);

        List<AreaInspecao> areas = areaRepo.findByLaudoIdOrderByOrdemAsc(laudo.getId());

        for (AreaInspecao area : areas) {
            doc.add(new Paragraph("DESCRIÇÃO: " + area.getNome())
                    .setFont(bold).setFontSize(12).setFontColor(PRIMARY_COLOR).setMarginTop(15).setMarginBottom(8));

            if (area.getDescricao() != null) {
                doc.add(new Paragraph(area.getDescricao()).setFont(regular).setFontSize(11).setMarginBottom(10));
            }

            List<com.laudotech.entity.Foto> fotos = area.getFotos();

            // 2 photos per row
            for (int i = 0; i < fotos.size(); i += 2) {
                Table photoTable = new Table(new float[]{1f, 1f}).useAllAvailableWidth().setMarginBottom(5);

                for (int j = i; j < Math.min(i + 2, fotos.size()); j++) {
                    com.laudotech.entity.Foto foto = fotos.get(j);
                    Cell cell = new Cell().setBorder(null).setPadding(4);
                    try {
                        byte[] rawBytes = downloadImageBytes(foto.getUrl());
                        byte[] imgBytes = foto.getPontos().isEmpty()
                                ? normalizeFormat(rawBytes)
                                : annotateImage(rawBytes, foto.getPontos());
                        Image img = new Image(ImageDataFactory.create(imgBytes));
                        img.setWidth(235).setAutoScale(false)
                                .setBorder(new SolidBorder(BORDER_COLOR, 1f));
                        cell.add(img);
                    } catch (Exception e) {
                        log.warn("Imagem não disponível: {} — {}", foto.getUrl(), e.getMessage(), e);
                        cell.add(new Paragraph("[Imagem não disponível]").setFont(regular).setFontSize(9));
                    }
                    photoTable.addCell(cell);
                }
                if (fotos.size() % 2 != 0 && i + 1 >= fotos.size()) {
                    photoTable.addCell(new Cell().setBorder(null));
                }
                doc.add(photoTable);

                // NR table for these photos
                boolean hasNrs = false;
                for (int j = i; j < Math.min(i + 2, fotos.size()); j++) {
                    if (!fotos.get(j).getPontos().isEmpty()) { hasNrs = true; break; }
                }

                if (hasNrs) {
                    Table nrTable = new Table(new float[]{30f, 80f, 200f, 260f}).useAllAvailableWidth().setMarginBottom(15);
                    addNrHeader(nrTable, bold, "Ponto", "NR", "Não Conformidade", "Recomendação");

                    boolean multiplePhotos = fotos.size() > 1;
                    DeviceRgb imgHeaderBg = new DeviceRgb(220, 230, 242);
                    int[] rowIndex = {0};

                    for (int j = i; j < Math.min(i + 2, fotos.size()); j++) {
                        com.laudotech.entity.Foto foto = fotos.get(j);
                        if (!foto.getPontos().isEmpty() && multiplePhotos) {
                            nrTable.addCell(new Cell(1, 4)
                                    .add(new Paragraph("Imagem " + (j + 1)).setFont(bold).setFontSize(9.5f)
                                            .setFontColor(PRIMARY_COLOR))
                                    .setBackgroundColor(imgHeaderBg)
                                    .setPadding(5)
                                    .setBorder(new SolidBorder(PRIMARY_COLOR, 0.5f)));
                        }
                        for (PontoAnotacao ponto : foto.getPontos()) {
                            for (PontoNr pnr : ponto.getNrs()) {
                                String sol = pnr.getSolucaoEspecifica() != null
                                        ? pnr.getSolucaoEspecifica()
                                        : pnr.getNrCatalogo().getSolucaoPadrao();
                                String nrNum = pnr.getNrCatalogo().getNumeroNr()
                                        + (pnr.getNrCatalogo().getArtigo() != null ? " " + pnr.getNrCatalogo().getArtigo() : "");
                                DeviceRgb nrColor = PRIORITY_COLORS_PDF.getOrDefault(
                                        pnr.getNrCatalogo().getPrioridade().name(),
                                        new DeviceRgb(100, 116, 139));
                                com.itextpdf.kernel.colors.Color rowBg = rowIndex[0]++ % 2 == 0 ? ZEBRA_BG : ColorConstants.WHITE;
                                nrTable.addCell(new Cell().add(new Paragraph(String.valueOf(ponto.getNumero()))
                                        .setFont(bold).setFontSize(9.5f)).setPadding(5)
                                        .setBackgroundColor(rowBg).setBorder(new SolidBorder(BORDER_COLOR, 0.5f)));
                                nrTable.addCell(new Cell().add(new Paragraph(nrNum)
                                        .setFont(bold).setFontSize(9.5f).setFontColor(nrColor)).setPadding(5)
                                        .setBackgroundColor(rowBg).setBorder(new SolidBorder(BORDER_COLOR, 0.5f)));
                                nrTable.addCell(new Cell().add(new Paragraph(pnr.getNrCatalogo().getTitulo())
                                        .setFont(regular).setFontSize(9.5f)).setPadding(5)
                                        .setBackgroundColor(rowBg).setBorder(new SolidBorder(BORDER_COLOR, 0.5f)));
                                nrTable.addCell(new Cell().add(new Paragraph(sol != null ? sol : "")
                                        .setFont(regular).setFontSize(9.5f)).setPadding(5)
                                        .setBackgroundColor(rowBg).setBorder(new SolidBorder(BORDER_COLOR, 0.5f)));
                            }
                        }
                    }
                    doc.add(nrTable);
                }
            }
        }
    }

    private void addItensCriticos(Document doc, Laudo laudo, PdfFont bold, PdfFont regular, String titulo) {
        addSectionTitle(doc, titulo, bold);
        doc.add(new Paragraph("Os itens abaixo foram classificados como CRÍTICOS e requerem ação imediata:")
                .setFont(regular).setFontSize(11).setMarginBottom(10));

        List<AreaInspecao> areas = areaRepo.findByLaudoIdOrderByOrdemAsc(laudo.getId());
        boolean hasCriticos = false;

        for (AreaInspecao area : areas) {
            List<com.laudotech.entity.Foto> fotos = area.getFotos();
            for (int fi = 0; fi < fotos.size(); fi++) {
                com.laudotech.entity.Foto foto = fotos.get(fi);
                int imgNum = fi + 1;
                for (PontoAnotacao ponto : foto.getPontos()) {
                    for (PontoNr pnr : ponto.getNrs()) {
                        if (pnr.getNrCatalogo().getPrioridade() == NrCatalogo.Prioridade.CRITICO) {
                            hasCriticos = true;
                            String sol = pnr.getSolucaoEspecifica() != null
                                    ? pnr.getSolucaoEspecifica()
                                    : pnr.getNrCatalogo().getSolucaoPadrao();
                            doc.add(new Paragraph("• [" + area.getNome() + " - Imagem " + imgNum + " - Ponto " + ponto.getNumero() + "] "
                                    + pnr.getNrCatalogo().getNumeroNr() + ": " + pnr.getNrCatalogo().getTitulo())
                                    .setFont(bold).setFontSize(11).setFontColor(new DeviceRgb(180, 0, 0)).setMarginBottom(3));
                            if (sol != null) {
                                doc.add(new Paragraph("  Ação: " + sol)
                                        .setFont(regular).setFontSize(10).setMarginLeft(15).setMarginBottom(8));
                            }
                        }
                    }
                }
            }
        }

        if (!hasCriticos) {
            doc.add(new Paragraph("Nenhum item crítico identificado nesta inspeção.")
                    .setFont(regular).setFontSize(11));
        }
    }

    private void addAssinatura(Document doc, Laudo laudo, PdfFont bold, PdfFont regular) {
        boolean showEng = laudo.isMostrarAssinaturaEngenheiro();
        boolean showCli = laudo.isMostrarAssinaturaCliente();
        if (!showEng && !showCli) return;

        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

        if (showEng && showCli) {
            addSectionTitle(doc, "ASSINATURAS", bold);
            doc.add(new Paragraph("\n"));
            Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            table.addCell(new Cell().add(buildEngenheiroSignatureBlock(laudo, bold, regular)).setBorder(Border.NO_BORDER));
            table.addCell(new Cell().add(buildClienteSignatureBlock(laudo, bold, regular)).setBorder(Border.NO_BORDER));
            doc.add(table);
        } else if (showEng) {
            addSectionTitle(doc, "ASSINATURA DO RESPONSÁVEL TÉCNICO", bold);
            doc.add(new Paragraph("\n\n"));
            doc.add(buildEngenheiroSignatureBlock(laudo, bold, regular));
        } else {
            addSectionTitle(doc, "ASSINATURA DO CLIENTE", bold);
            doc.add(new Paragraph("\n\n"));
            doc.add(buildClienteSignatureBlock(laudo, bold, regular));
        }
    }

    private Div buildEngenheiroSignatureBlock(Laudo laudo, PdfFont bold, PdfFont regular) {
        Div div = new Div();
        if (laudo.getEngenheiro().getAssinaturaUrl() != null) {
            try {
                Image sig = new Image(ImageDataFactory.create(new URL(laudo.getEngenheiro().getAssinaturaUrl())));
                sig.setWidth(160).setHorizontalAlignment(HorizontalAlignment.CENTER);
                div.add(sig);
            } catch (Exception e) {
                div.add(new Paragraph("\n\n_____________________________").setFont(regular).setTextAlignment(TextAlignment.CENTER));
            }
        } else {
            div.add(new Paragraph("\n\n_____________________________").setFont(regular).setTextAlignment(TextAlignment.CENTER));
        }
        div.add(new Paragraph(laudo.getEngenheiro().getNome())
                .setFont(bold).setFontSize(12).setTextAlignment(TextAlignment.CENTER));
        div.add(new Paragraph(laudo.getEngenheiro().getCrea())
                .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        if (laudo.getEngenheiro().getTituloProfissional() != null) {
            div.add(new Paragraph(laudo.getEngenheiro().getTituloProfissional())
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }
        if (laudo.getDataEmissao() != null) {
            div.add(new Paragraph(laudo.getDataEmissao().format(DATE_FMT))
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }
        return div;
    }

    private Div buildClienteSignatureBlock(Laudo laudo, PdfFont bold, PdfFont regular) {
        Div div = new Div();
        div.add(new Paragraph("\n\n_____________________________").setFont(regular).setTextAlignment(TextAlignment.CENTER));
        div.add(new Paragraph(laudo.getCliente().getNome())
                .setFont(bold).setFontSize(12).setTextAlignment(TextAlignment.CENTER));
        if (laudo.getCliente().getCnpj() != null) {
            div.add(new Paragraph(laudo.getCliente().getCnpj())
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }
        if (laudo.getDataEmissao() != null) {
            div.add(new Paragraph(laudo.getDataEmissao().format(DATE_FMT))
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        }
        return div;
    }

    private void addSectionTitle(Document doc, String title, PdfFont bold) {
        doc.add(new Paragraph(title)
                .setFont(bold).setFontSize(14).setFontColor(PRIMARY_COLOR)
                .setBorderBottom(new SolidBorder(PRIMARY_COLOR, 1.2f))
                .setPaddingBottom(3)
                .setMarginTop(18).setMarginBottom(10));
    }

    private void addTableRow(Table table, String label, String value, PdfFont bold, PdfFont regular) {
        table.addCell(new Cell().add(new Paragraph(label).setFont(bold).setFontSize(10.5f))
                .setBackgroundColor(HEADER_BG)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.75f)).setPadding(7));
        table.addCell(new Cell().add(new Paragraph(value != null ? value : "").setFont(regular).setFontSize(10.5f))
                .setBorder(new SolidBorder(BORDER_COLOR, 0.75f)).setPadding(7));
    }

    private void addNrHeader(Table table, PdfFont bold, String... cols) {
        for (String col : cols) {
            table.addHeaderCell(new Cell().add(new Paragraph(col).setFont(bold).setFontSize(9.5f))
                    .setBackgroundColor(PRIMARY_COLOR).setFontColor(ColorConstants.WHITE)
                    .setBorder(new SolidBorder(PRIMARY_COLOR, 0.75f)).setPadding(6));
        }
    }

    private void addNrRow(Table table, PdfFont regular, String... vals) {
        for (String val : vals) {
            table.addCell(new Cell().add(new Paragraph(val != null ? val : "").setFont(regular).setFontSize(9.5f))
                    .setBorder(new SolidBorder(BORDER_COLOR, 0.5f)).setPadding(5));
        }
    }

    private byte[] downloadImageBytes(String url) throws Exception {
        return fileStorageService.downloadBytes(url);
    }

    // Converts any ImageIO-readable format to JPEG TYPE_INT_RGB for iText compatibility.
    // Falls back to raw bytes when ImageIO can't decode the format.
    private byte[] normalizeFormat(byte[] imageBytes) {
        try {
            BufferedImage src = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (src == null) {
                log.warn("ImageIO não conseguiu decodificar a imagem (formato não suportado) — repassando bytes originais ao iText");
                return imageBytes;
            }
            BufferedImage rgb = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.drawImage(src, 0, 0, null);
            g.dispose();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(rgb, "JPEG", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.warn("normalizeFormat falhou, usando bytes originais: {}", e.getMessage());
            return imageBytes;
        }
    }

    private byte[] annotateImage(byte[] imageBytes, List<PontoAnotacao> pontos) throws Exception {
        BufferedImage src = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (src == null) return imageBytes;

        // Use TYPE_INT_RGB (no alpha channel) for full iText compatibility.
        // AlphaComposite simulates transparency during drawing without requiring ARGB PNG.
        BufferedImage img = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(src, 0, 0, null);

        int r = Math.max(20, Math.min(img.getWidth(), img.getHeight()) / 25);

        for (PontoAnotacao ponto : pontos) {
            int cx = (int) (ponto.getXPct().doubleValue() * img.getWidth());
            int cy = (int) (ponto.getYPct().doubleValue() * img.getHeight());

            Color fill = getPontoColor(ponto);

            // Fill with ~82% opacity blended onto the RGB background
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 210f / 255f));
            g.setColor(fill);
            g.fillOval(cx - r, cy - r, r * 2, r * 2);

            // White border fully opaque
            g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1f));
            g.setColor(Color.WHITE);
            g.setStroke(new BasicStroke(3f));
            g.drawOval(cx - r, cy - r, r * 2, r * 2);

            // Number label
            g.setFont(new Font("Arial", Font.BOLD, (int) (r * 1.1)));
            String num = String.valueOf(ponto.getNumero());
            FontMetrics fm = g.getFontMetrics();
            g.drawString(num, cx - fm.stringWidth(num) / 2, cy + fm.getAscent() / 2 - 1);
        }

        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "PNG", baos);
        return baos.toByteArray();
    }

    private Color getPontoColor(PontoAnotacao ponto) {
        String[] order = {"CRITICO", "ALTO", "MEDIO", "BAIXO"};
        for (String p : order) {
            for (PontoNr pnr : ponto.getNrs()) {
                if (pnr.getNrCatalogo().getPrioridade().name().equals(p)) {
                    switch (p) {
                        case "CRITICO": return new Color(220, 38, 38);
                        case "ALTO":    return new Color(234, 88, 12);
                        case "MEDIO":   return new Color(202, 138, 4);
                        default:        return new Color(37, 99, 235);
                    }
                }
            }
        }
        return new Color(100, 116, 139);
    }

    private static class FooterHandler implements IEventHandler {
        private final Laudo laudo;
        private final PdfFont font;

        FooterHandler(Laudo laudo, PdfFont font) {
            this.laudo = laudo;
            this.font = font;
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            int pageNum = pdf.getPageNumber(page);
            if (pageNum == 1) return; // Skip cover
            Rectangle rect = page.getPageSize();
            PdfCanvas canvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
            canvas.beginText()
                    .setFontAndSize(font, 8)
                    .moveText(rect.getLeft() + 56.7f, rect.getBottom() + 20)
                    .showText(laudo.getEngenheiro().getNome() + " | " + laudo.getEngenheiro().getCrea())
                    .endText()
                    .beginText()
                    .setFontAndSize(font, 8)
                    .moveText(rect.getRight() - 80, rect.getBottom() + 20)
                    .showText("Página " + pageNum)
                    .endText()
                    .release();
        }
    }

    private static class WatermarkHandler implements IEventHandler {
        private final PdfFont font;

        WatermarkHandler(PdfFont font) {
            this.font = font;
        }

        @Override
        public void handleEvent(Event event) {
            PdfDocumentEvent docEvent = (PdfDocumentEvent) event;
            PdfDocument pdf = docEvent.getDocument();
            PdfPage page = docEvent.getPage();
            Rectangle rect = page.getPageSize();
            float centerX = (rect.getLeft() + rect.getRight()) / 2;
            float centerY = (rect.getBottom() + rect.getTop()) / 2;

            PdfCanvas pdfCanvas = new PdfCanvas(page.newContentStreamBefore(), page.getResources(), pdf);
            PdfExtGState gs = new PdfExtGState().setFillOpacity(0.15f);
            pdfCanvas.saveState().setExtGState(gs);

            Canvas canvas = new Canvas(pdfCanvas, rect);
            canvas.showTextAligned(new Paragraph("RASCUNHO").setFont(font).setFontSize(72)
                            .setFontColor(new DeviceRgb(150, 150, 150)),
                    centerX, centerY, pdf.getPageNumber(page), TextAlignment.CENTER, VerticalAlignment.MIDDLE, (float) (Math.PI / 4));
            canvas.close();

            pdfCanvas.restoreState().release();
        }
    }
}
