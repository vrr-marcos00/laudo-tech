package com.laudotech.service;

import com.laudotech.dto.AreaInspecaoDto;
import com.laudotech.dto.AreaInspecaoRequest;
import com.laudotech.dto.FotoDto;
import com.laudotech.entity.AreaInspecao;
import com.laudotech.entity.Engenheiro;
import com.laudotech.entity.Laudo;
import com.laudotech.repository.AreaInspecaoRepository;
import com.laudotech.repository.LaudoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AreaInspecaoService {
    private final AreaInspecaoRepository repo;
    private final LaudoRepository laudoRepo;
    private final FotoService fotoService;
    private final LaudoService laudoService;

    public List<AreaInspecaoDto> listar(Long laudoId, Engenheiro authEng) {
        laudoService.assertAcesso(laudoId, authEng);
        return repo.findByLaudoIdOrderByOrdemAsc(laudoId).stream().map(this::toDto).toList();
    }

    @Transactional
    public AreaInspecaoDto criar(Long laudoId, AreaInspecaoRequest req, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(laudoId).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        laudoService.assertAcesso(laudo, authEng);
        laudoService.assertEditavel(laudo);
        int ordem = req.getOrdem() != null ? req.getOrdem() : repo.findByLaudoIdOrderByOrdemAsc(laudoId).size();
        AreaInspecao area = AreaInspecao.builder()
                .laudo(laudo).nome(req.getNome()).descricao(req.getDescricao()).ordem(ordem).build();
        return toDto(repo.save(area));
    }

    @Transactional
    public AreaInspecaoDto atualizar(Long id, AreaInspecaoRequest req, Engenheiro authEng) {
        AreaInspecao area = repo.findById(id).orElseThrow(() -> new RuntimeException("Área não encontrada"));
        laudoService.assertAcesso(area.getLaudo(), authEng);
        laudoService.assertEditavel(area.getLaudo());
        area.setNome(req.getNome());
        area.setDescricao(req.getDescricao());
        if (req.getOrdem() != null) area.setOrdem(req.getOrdem());
        return toDto(repo.save(area));
    }

    @Transactional
    public void deletar(Long id, Engenheiro authEng) {
        AreaInspecao area = repo.findById(id).orElseThrow(() -> new RuntimeException("Área não encontrada"));
        laudoService.assertAcesso(area.getLaudo(), authEng);
        laudoService.assertEditavel(area.getLaudo());
        repo.deleteById(id);
    }

    AreaInspecaoDto toDto(AreaInspecao a) {
        List<FotoDto> fotos = a.getFotos() == null ? List.of() :
                a.getFotos().stream().map(fotoService::toDto).toList();
        return AreaInspecaoDto.builder()
                .id(a.getId()).nome(a.getNome()).descricao(a.getDescricao())
                .ordem(a.getOrdem()).fotos(fotos).build();
    }
}
