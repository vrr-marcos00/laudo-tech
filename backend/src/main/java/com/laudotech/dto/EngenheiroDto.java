package com.laudotech.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class EngenheiroDto {
    private Long id;
    private String nome;
    private String crea;
    private String tituloProfissional;
    private String estado;
    private String email;
    private String telefone;
    private String logoUrl;
    private String assinaturaUrl;
    private Boolean ativo;
}
