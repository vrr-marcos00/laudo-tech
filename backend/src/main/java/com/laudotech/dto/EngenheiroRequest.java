package com.laudotech.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EngenheiroRequest {
    @NotBlank private String nome;
    @NotBlank private String crea;
    private String tituloProfissional;
    @Email @NotBlank private String email;
    private String telefone;
    private String senha;
}
