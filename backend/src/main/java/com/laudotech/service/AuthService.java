package com.laudotech.service;

import com.laudotech.config.JwtUtil;
import com.laudotech.dto.EngenheiroRequest;
import com.laudotech.dto.LoginRequest;
import com.laudotech.dto.LoginResponse;
import com.laudotech.entity.Engenheiro;
import com.laudotech.repository.EngenheiroRepository;
import static com.laudotech.util.TextUtils.upper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final EngenheiroRepository engenheiroRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        Engenheiro eng = engenheiroRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Credenciais inválidas"));
        if (!passwordEncoder.matches(request.getSenha(), eng.getSenhaHash())) {
            throw new RuntimeException("Credenciais inválidas");
        }
        return toResponse(eng);
    }

    public LoginResponse register(EngenheiroRequest req) {
        if (req.getSenha() == null || req.getSenha().isBlank()) {
            throw new RuntimeException("Senha é obrigatória.");
        }
        if (engenheiroRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("Já existe uma conta com este e-mail.");
        }
        Engenheiro eng = Engenheiro.builder()
                .nome(upper(req.getNome()))
                .crea(upper(req.getCrea()))
                .tituloProfissional(upper(req.getTituloProfissional()))
                .estado(upper(req.getEstado()))
                .email(req.getEmail())
                .telefone(upper(req.getTelefone()))
                .senhaHash(passwordEncoder.encode(req.getSenha()))
                .ativo(true)
                .build();
        return toResponse(engenheiroRepository.save(eng));
    }

    private LoginResponse toResponse(Engenheiro eng) {
        return LoginResponse.builder()
                .token(jwtUtil.generate(eng.getEmail()))
                .engenheiroId(eng.getId())
                .nome(eng.getNome())
                .email(eng.getEmail())
                .crea(eng.getCrea())
                .tituloProfissional(eng.getTituloProfissional())
                .logoUrl(eng.getLogoUrl())
                .build();
    }
}
