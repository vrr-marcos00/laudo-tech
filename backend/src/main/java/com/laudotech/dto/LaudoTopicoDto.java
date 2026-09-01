package com.laudotech.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class LaudoTopicoDto {
    private Long id;
    private String titulo;
    private String conteudo;
    private Integer ordem;
    private String tipo;
}
