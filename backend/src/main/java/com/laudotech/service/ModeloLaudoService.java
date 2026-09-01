package com.laudotech.service;

import com.laudotech.dto.ModeloLaudoDto;
import com.laudotech.dto.ModeloLaudoRequest;
import com.laudotech.dto.ModeloTopicoDto;
import com.laudotech.entity.Engenheiro;
import com.laudotech.entity.ModeloLaudo;
import com.laudotech.entity.ModeloTopico;
import com.laudotech.repository.ModeloLaudoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class ModeloLaudoService {
    private final ModeloLaudoRepository repo;

    public List<ModeloLaudoDto> listar(Engenheiro authEng) {
        return repo.findByEngenheiroIdOrderByNomeAsc(authEng.getId()).stream().map(this::toDto).toList();
    }

    public ModeloLaudoDto buscar(Long id, Engenheiro authEng) {
        return toDto(assertAcesso(id, authEng));
    }

    @Transactional
    public ModeloLaudoDto criar(Engenheiro authEng, ModeloLaudoRequest req) {
        ModeloLaudo modelo = ModeloLaudo.builder().engenheiro(authEng)
                .nome(req.getNome()).descricao(req.getDescricao()).build();
        if (req.getTopicos() != null) {
            List<ModeloTopico> topicos = IntStream.range(0, req.getTopicos().size()).mapToObj(i -> {
                ModeloTopicoDto t = req.getTopicos().get(i);
                return ModeloTopico.builder().modelo(modelo).titulo(t.getTitulo()).conteudo(t.getConteudo()).ordem(i).build();
            }).toList();
            modelo.getTopicos().addAll(topicos);
        }
        return toDto(repo.save(modelo));
    }

    @Transactional
    public ModeloLaudoDto atualizar(Long id, Engenheiro authEng, ModeloLaudoRequest req) {
        ModeloLaudo modelo = assertAcesso(id, authEng);
        modelo.setNome(req.getNome()); modelo.setDescricao(req.getDescricao());
        modelo.getTopicos().clear();
        if (req.getTopicos() != null) {
            List<ModeloTopico> topicos = IntStream.range(0, req.getTopicos().size()).mapToObj(i -> {
                ModeloTopicoDto t = req.getTopicos().get(i);
                return ModeloTopico.builder().modelo(modelo).titulo(t.getTitulo()).conteudo(t.getConteudo()).ordem(i).build();
            }).toList();
            modelo.getTopicos().addAll(topicos);
        }
        return toDto(repo.save(modelo));
    }

    public void deletar(Long id, Engenheiro authEng) {
        ModeloLaudo modelo = assertAcesso(id, authEng);
        repo.delete(modelo);
    }

    private ModeloLaudo assertAcesso(Long id, Engenheiro authEng) {
        ModeloLaudo modelo = repo.findById(id).orElseThrow(() -> new RuntimeException("Modelo não encontrado"));
        if (!modelo.getEngenheiro().getId().equals(authEng.getId())) {
            throw new RuntimeException("Modelo não encontrado");
        }
        return modelo;
    }

    private ModeloLaudoDto toDto(ModeloLaudo m) {
        List<ModeloTopicoDto> topicos = m.getTopicos().stream()
                .map(t -> ModeloTopicoDto.builder().id(t.getId()).titulo(t.getTitulo()).conteudo(t.getConteudo()).ordem(t.getOrdem()).build())
                .toList();
        return ModeloLaudoDto.builder().id(m.getId()).nome(m.getNome()).descricao(m.getDescricao()).createdAt(m.getCreatedAt())
                .topicos(topicos)
                .build();
    }
}
