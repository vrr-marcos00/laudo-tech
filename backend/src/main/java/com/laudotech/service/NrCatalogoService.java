package com.laudotech.service;

import com.laudotech.dto.NrCatalogoDto;
import com.laudotech.dto.NrCatalogoRequest;
import com.laudotech.entity.Engenheiro;
import com.laudotech.entity.NrCatalogo;
import com.laudotech.entity.NrCatalogo.Prioridade;
import com.laudotech.repository.NrCatalogoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NrCatalogoService {
    private final NrCatalogoRepository repo;

    public List<NrCatalogoDto> listar(Engenheiro authEng, String search, String prioridade) {
        List<NrCatalogo> nrs = repo.findByEngenheiroIdOrderByNumeroNrAscArtigoAsc(authEng.getId());

        String s = (search != null && !search.isBlank()) ? search.trim().toLowerCase() : null;
        Prioridade p = (prioridade != null && !prioridade.isBlank()) ? Prioridade.valueOf(prioridade) : null;

        return nrs.stream()
                .filter(n -> s == null || n.getTitulo().toLowerCase().contains(s) || n.getNumeroNr().toLowerCase().contains(s))
                .filter(n -> p == null || n.getPrioridade() == p)
                .map(this::toDto)
                .toList();
    }

    public NrCatalogoDto criar(Engenheiro authEng, NrCatalogoRequest req) {
        NrCatalogo nr = NrCatalogo.builder()
                .engenheiro(authEng)
                .numeroNr(req.getNumeroNr())
                .artigo(req.getArtigo())
                .titulo(req.getTitulo())
                .descricao(req.getDescricao())
                .solucaoPadrao(req.getSolucaoPadrao())
                .prioridade(req.getPrioridade() != null ? Prioridade.valueOf(req.getPrioridade()) : Prioridade.MEDIO)
                .build();
        return toDto(repo.save(nr));
    }

    public NrCatalogoDto atualizar(Long id, Engenheiro authEng, NrCatalogoRequest req) {
        NrCatalogo nr = assertAcesso(id, authEng);
        nr.setNumeroNr(req.getNumeroNr()); nr.setArtigo(req.getArtigo()); nr.setTitulo(req.getTitulo());
        nr.setDescricao(req.getDescricao()); nr.setSolucaoPadrao(req.getSolucaoPadrao());
        if (req.getPrioridade() != null) nr.setPrioridade(Prioridade.valueOf(req.getPrioridade()));
        return toDto(repo.save(nr));
    }

    public void deletar(Long id, Engenheiro authEng) {
        NrCatalogo nr = assertAcesso(id, authEng);
        repo.delete(nr);
    }

    private NrCatalogo assertAcesso(Long id, Engenheiro authEng) {
        NrCatalogo nr = repo.findById(id).orElseThrow(() -> new RuntimeException("NR não encontrada"));
        if (!nr.getEngenheiro().getId().equals(authEng.getId())) {
            throw new RuntimeException("NR não encontrada");
        }
        return nr;
    }

    private NrCatalogoDto toDto(NrCatalogo nr) {
        return NrCatalogoDto.builder()
                .id(nr.getId()).numeroNr(nr.getNumeroNr()).artigo(nr.getArtigo())
                .titulo(nr.getTitulo()).descricao(nr.getDescricao())
                .solucaoPadrao(nr.getSolucaoPadrao()).prioridade(nr.getPrioridade().name())
                .build();
    }
}
