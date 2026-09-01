package com.laudotech.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class AreaInspecaoDto {
    private Long id;
    private String nome;
    private String descricao;
    private Integer ordem;
    private List<FotoDto> fotos;
}
