package com.laudotech.service;

import com.laudotech.dto.EngenheiroDto;
import com.laudotech.dto.EngenheiroRequest;
import com.laudotech.entity.Engenheiro;
import com.laudotech.repository.EngenheiroRepository;
import static com.laudotech.util.TextUtils.upper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class EngenheiroService {
    private final EngenheiroRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorage;

    public EngenheiroDto buscar(Long id, Engenheiro authEng) {
        Engenheiro alvo = assertAcesso(id, authEng);
        return toDto(alvo);
    }

    public EngenheiroDto atualizar(Long id, EngenheiroRequest req, Engenheiro authEng) {
        Engenheiro eng = assertAcesso(id, authEng);
        eng.setNome(upper(req.getNome()));
        eng.setCrea(upper(req.getCrea()));
        eng.setTituloProfissional(upper(req.getTituloProfissional()));
        eng.setEstado(upper(req.getEstado()));
        eng.setTelefone(upper(req.getTelefone()));
        if (req.getSenha() != null && !req.getSenha().isBlank()) {
            eng.setSenhaHash(passwordEncoder.encode(req.getSenha()));
        }
        return toDto(repo.save(eng));
    }

    public EngenheiroDto uploadLogo(Long id, MultipartFile file, Engenheiro authEng) {
        Engenheiro eng = assertAcesso(id, authEng);
        if (eng.getLogoUrl() != null) fileStorage.delete(eng.getLogoUrl());
        eng.setLogoUrl(fileStorage.upload(file, "engenheiros/logos"));
        return toDto(repo.save(eng));
    }

    public EngenheiroDto uploadAssinatura(Long id, MultipartFile file, Engenheiro authEng) {
        Engenheiro eng = assertAcesso(id, authEng);
        if (eng.getAssinaturaUrl() != null) fileStorage.delete(eng.getAssinaturaUrl());
        eng.setAssinaturaUrl(fileStorage.upload(file, "engenheiros/assinaturas"));
        return toDto(repo.save(eng));
    }

    private Engenheiro assertAcesso(Long id, Engenheiro authEng) {
        Engenheiro alvo = repo.findById(id).orElseThrow(() -> new RuntimeException("Engenheiro não encontrado"));
        if (!alvo.getId().equals(authEng.getId())) {
            throw new RuntimeException("Você não tem permissão para acessar este engenheiro.");
        }
        return alvo;
    }

    private EngenheiroDto toDto(Engenheiro e) {
        return EngenheiroDto.builder()
                .id(e.getId())
                .nome(e.getNome())
                .crea(e.getCrea())
                .tituloProfissional(e.getTituloProfissional())
                .estado(e.getEstado())
                .email(e.getEmail())
                .telefone(e.getTelefone())
                .logoUrl(e.getLogoUrl())
                .assinaturaUrl(e.getAssinaturaUrl())
                .ativo(e.getAtivo())
                .build();
    }
}
