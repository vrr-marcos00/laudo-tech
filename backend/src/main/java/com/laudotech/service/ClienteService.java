package com.laudotech.service;

import com.laudotech.dto.ClienteDto;
import com.laudotech.dto.ClienteRequest;
import com.laudotech.entity.Cliente;
import com.laudotech.entity.Engenheiro;
import com.laudotech.repository.ClienteRepository;
import com.laudotech.repository.LaudoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {
    private final ClienteRepository repo;
    private final LaudoRepository laudoRepo;
    private final FileStorageService fileStorage;

    public List<ClienteDto> listar(String search, Engenheiro authEng) {
        List<Cliente> clientes = (search != null && !search.isBlank())
                ? repo.search(authEng.getId(), search)
                : repo.findByEngenheiroIdOrderByNomeAsc(authEng.getId());
        return clientes.stream().map(this::toDto).toList();
    }

    public ClienteDto buscar(Long id, Engenheiro authEng) {
        Cliente c = repo.findById(id).orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        assertAcesso(c, authEng);
        return toDto(c);
    }

    @Transactional
    public ClienteDto criar(ClienteRequest req, Engenheiro authEng) {
        if (req.getCnpj() != null && !req.getCnpj().isBlank()) {
            if (repo.existsByEngenheiroIdAndCnpj(authEng.getId(), req.getCnpj())) {
                throw new RuntimeException("Já existe um cliente com este CNPJ cadastrado.");
            }
        } else if (repo.existsByEngenheiroIdAndNomeIgnoreCase(authEng.getId(), req.getNome())) {
            throw new RuntimeException("Já existe um cliente com este nome cadastrado.");
        }

        Cliente c = Cliente.builder()
                .engenheiro(authEng).cnpj(req.getCnpj()).nome(req.getNome())
                .descricao(req.getDescricao()).email(req.getEmail())
                .telefone(req.getTelefone()).endereco(req.getEndereco())
                .cidade(req.getCidade()).estado(req.getEstado()).cep(req.getCep())
                .build();
        return toDto(repo.save(c));
    }

    public ClienteDto atualizar(Long id, ClienteRequest req, Engenheiro authEng) {
        Cliente c = repo.findById(id).orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        assertAcesso(c, authEng);
        c.setCnpj(req.getCnpj()); c.setNome(req.getNome()); c.setDescricao(req.getDescricao());
        c.setEmail(req.getEmail()); c.setTelefone(req.getTelefone()); c.setEndereco(req.getEndereco());
        c.setCidade(req.getCidade()); c.setEstado(req.getEstado()); c.setCep(req.getCep());
        return toDto(repo.save(c));
    }

    public ClienteDto uploadFoto(Long id, MultipartFile file, Engenheiro authEng) {
        Cliente c = repo.findById(id).orElseThrow();
        assertAcesso(c, authEng);
        if (c.getFotoUrl() != null) fileStorage.delete(c.getFotoUrl());
        c.setFotoUrl(fileStorage.upload(file, "clientes/fotos"));
        return toDto(repo.save(c));
    }

    @Transactional
    public void deletar(Long id, Engenheiro authEng) {
        Cliente c = repo.findById(id).orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
        assertAcesso(c, authEng);
        if (laudoRepo.existsByClienteId(id)) {
            throw new RuntimeException("Este cliente possui laudos vinculados e não pode ser excluído.");
        }
        if (c.getFotoUrl() != null) fileStorage.delete(c.getFotoUrl());
        repo.delete(c);
    }

    private void assertAcesso(Cliente c, Engenheiro authEng) {
        if (!c.getEngenheiro().getId().equals(authEng.getId())) {
            throw new RuntimeException("Você não tem permissão para acessar este cliente.");
        }
    }

    private ClienteDto toDto(Cliente c) {
        return ClienteDto.builder()
                .id(c.getId()).cnpj(c.getCnpj()).nome(c.getNome()).descricao(c.getDescricao())
                .email(c.getEmail()).telefone(c.getTelefone()).endereco(c.getEndereco())
                .cidade(c.getCidade()).estado(c.getEstado()).cep(c.getCep())
                .fotoUrl(c.getFotoUrl())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
