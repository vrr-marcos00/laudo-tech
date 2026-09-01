package com.laudotech.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class LoginResponse {
    private String token;
    private Long engenheiroId;
    private String nome;
    private String email;
    private String crea;
    private String tituloProfissional;
    private String logoUrl;
}
