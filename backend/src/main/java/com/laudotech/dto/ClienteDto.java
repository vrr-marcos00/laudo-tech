package com.laudotech.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class ClienteDto {
    private Long id;
    private String cnpj;
    private String nome;
    private String descricao;
    private String email;
    private String telefone;
    private String endereco;
    private String cidade;
    private String estado;
    private String cep;
    private String fotoUrl;
    private LocalDateTime createdAt;
}
