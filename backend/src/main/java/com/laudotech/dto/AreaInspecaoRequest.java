package com.laudotech.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AreaInspecaoRequest {
    @NotBlank private String nome;
    private String descricao;
    private Integer ordem;
}
