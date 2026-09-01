package com.laudotech.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NrCatalogoRequest {
    @NotBlank private String numeroNr;
    private String artigo;
    @NotBlank private String titulo;
    private String descricao;
    private String solucaoPadrao;
    private String prioridade;
}
