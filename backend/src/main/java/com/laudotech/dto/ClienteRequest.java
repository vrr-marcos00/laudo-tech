package com.laudotech.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClienteRequest {
    private String cnpj;
    @NotBlank private String nome;
    private String descricao;
    private String email;
    private String telefone;
    private String endereco;
    private String cidade;
    private String estado;
    private String cep;
}
