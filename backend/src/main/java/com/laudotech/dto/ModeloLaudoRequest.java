package com.laudotech.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;

@Data
public class ModeloLaudoRequest {
    @NotBlank private String nome;
    private String descricao;
    private List<ModeloTopicoDto> topicos;
}
