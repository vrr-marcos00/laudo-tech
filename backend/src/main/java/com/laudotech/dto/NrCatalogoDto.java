package com.laudotech.dto;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class NrCatalogoDto {
    private Long id;
    private String numeroNr;
    private String artigo;
    private String titulo;
    private String descricao;
    private String solucaoPadrao;
    private String prioridade;
}
