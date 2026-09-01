package com.laudotech.service;

import com.laudotech.dto.*;
import com.laudotech.entity.*;
import com.laudotech.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class FotoService {
    private final FotoRepository fotoRepo;
    private final AreaInspecaoRepository areaRepo;
    private final PontoAnotacaoRepository pontoRepo;
    private final NrCatalogoRepository nrRepo;
    private final FileStorageService fileStorage;
    private final LaudoService laudoService;

    public FotoDto upload(Long areaId, MultipartFile file, Engenheiro authEng) {
        AreaInspecao area = areaRepo.findById(areaId).orElseThrow(() -> new RuntimeException("Área não encontrada"));
        laudoService.assertAcesso(area.getLaudo(), authEng);
        laudoService.assertEditavel(area.getLaudo());
        int ordem = area.getFotos().size();
        String url = fileStorage.upload(file, "laudos/fotos");
        Foto foto = Foto.builder().area(area).url(url).nomeArquivo(file.getOriginalFilename()).ordem(ordem).build();
        return toDto(fotoRepo.save(foto));
    }

    @Transactional
    public void deletar(Long fotoId, Engenheiro authEng) {
        Foto foto = fotoRepo.findById(fotoId).orElseThrow();
        laudoService.assertAcesso(foto.getArea().getLaudo(), authEng);
        laudoService.assertEditavel(foto.getArea().getLaudo());
        String url = foto.getUrl();
        fotoRepo.delete(foto);
        if (fotoRepo.countByUrl(url) == 0) {
            fileStorage.delete(url);
        }
    }

    @Transactional
    public List<PontoAnotacaoDto> salvarPontos(Long fotoId, List<PontoAnotacaoDto> pontosDto, Engenheiro authEng) {
        Foto foto = fotoRepo.findById(fotoId).orElseThrow(() -> new RuntimeException("Foto não encontrada"));
        laudoService.assertAcesso(foto.getArea().getLaudo(), authEng);
        laudoService.assertEditavel(foto.getArea().getLaudo());
        pontoRepo.deleteByFotoId(fotoId);
        AtomicInteger num = new AtomicInteger(1);
        List<PontoAnotacao> pontos = pontosDto.stream().map(dto -> {
            PontoAnotacao ponto = PontoAnotacao.builder()
                    .foto(foto)
                    .numero(num.getAndIncrement())
                    .xPct(dto.getXPct())
                    .yPct(dto.getYPct())
                    .build();
            List<PontoNr> nrs = dto.getNrs().stream().map(nrDto -> {
                NrCatalogo nr = nrRepo.findById(nrDto.getNrCatalogoId()).orElseThrow();
                return PontoNr.builder()
                        .ponto(ponto).nrCatalogo(nr)
                        .solucaoEspecifica(nrDto.getSolucaoEspecifica())
                        .build();
            }).toList();
            ponto.getNrs().addAll(nrs);
            return ponto;
        }).toList();
        pontoRepo.saveAll(pontos);
        return pontos.stream().map(this::toPontoDto).toList();
    }

    public List<PontoAnotacaoDto> listarPontos(Long fotoId, Engenheiro authEng) {
        Foto foto = fotoRepo.findById(fotoId).orElseThrow(() -> new RuntimeException("Foto não encontrada"));
        laudoService.assertAcesso(foto.getArea().getLaudo(), authEng);
        return pontoRepo.findByFotoIdOrderByNumeroAsc(fotoId).stream().map(this::toPontoDto).toList();
    }

    FotoDto toDto(Foto f) {
        List<PontoAnotacaoDto> pontos = f.getPontos() == null ? List.of() :
                f.getPontos().stream().map(this::toPontoDto).toList();
        return FotoDto.builder()
                .id(f.getId()).url(f.getUrl()).nomeArquivo(f.getNomeArquivo())
                .ordem(f.getOrdem()).pontos(pontos).build();
    }

    private PontoAnotacaoDto toPontoDto(PontoAnotacao p) {
        List<PontoNrDto> nrs = p.getNrs().stream().map(pnr -> PontoNrDto.builder()
                .id(pnr.getId())
                .nrCatalogoId(pnr.getNrCatalogo().getId())
                .numeroNr(pnr.getNrCatalogo().getNumeroNr())
                .artigo(pnr.getNrCatalogo().getArtigo())
                .titulo(pnr.getNrCatalogo().getTitulo())
                .solucaoPadrao(pnr.getNrCatalogo().getSolucaoPadrao())
                .solucaoEspecifica(pnr.getSolucaoEspecifica())
                .prioridade(pnr.getNrCatalogo().getPrioridade().name())
                .build()).toList();
        return PontoAnotacaoDto.builder()
                .id(p.getId()).numero(p.getNumero())
                .xPct(p.getXPct()).yPct(p.getYPct()).nrs(nrs).build();
    }
}
