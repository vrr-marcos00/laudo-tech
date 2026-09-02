package com.laudotech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class LaudoRequest {
    @NotNull private Long clienteId;
    private Long modeloId;
    private String numeroArt;
    private LocalDate dataVisita;
    private LocalDate dataEmissao;
    private String quemAcompanhou;
    private Boolean mostrarCapa;
    private Boolean mostrarSumario;
    private Boolean mostrarAssinaturaEngenheiro;
    private Boolean mostrarAssinaturaCliente;
    private Boolean mostrarCapaEmpresa;
    private Boolean mostrarDescricaoEmpresa;
    private String tituloCapa;
    private String subtituloCapa;
}
