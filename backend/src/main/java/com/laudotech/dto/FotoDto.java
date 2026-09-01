package com.laudotech.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class FotoDto {
    private Long id;
    private String url;
    private String nomeArquivo;
    private Integer ordem;
    private List<PontoAnotacaoDto> pontos;
}
