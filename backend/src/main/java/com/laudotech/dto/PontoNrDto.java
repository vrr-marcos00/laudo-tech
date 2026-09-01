package com.laudotech.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PontoNrDto {
    private Long id;
    private Long nrCatalogoId;
    private String numeroNr;
    private String artigo;
    private String titulo;
    private String solucaoPadrao;
    private String solucaoEspecifica;
    private String prioridade;
}
