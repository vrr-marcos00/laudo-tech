package com.laudotech.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class ModeloLaudoDto {
    private Long id;
    private String nome;
    private String descricao;
    private LocalDateTime createdAt;
    private List<ModeloTopicoDto> topicos;
}
