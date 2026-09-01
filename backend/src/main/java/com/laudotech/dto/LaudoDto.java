package com.laudotech.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder(toBuilder = true)
public class LaudoDto {
    private Long id;
    private Long engenheiroId;
    private String engenheiroNome;
    private String engenheiroCrea;
    private Long clienteId;
    private String clienteNome;
    private String clienteCnpj;
    private Long modeloId;
    private String status;
    private String numeroArt;
    private LocalDate dataVisita;
    private LocalDate dataEmissao;
    private String quemAcompanhou;
    private Integer versao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean mostrarCapa;
    private boolean mostrarSumario;
    private boolean mostrarAssinaturaEngenheiro;
    private boolean mostrarAssinaturaCliente;
    private String logoCapaUrl;
    private String tituloCapa;
    private String subtituloCapa;
    private Long laudoOrigemId;
    private Integer laudoOrigemVersao;
    private List<LaudoTopicoDto> topicos;
    private List<AreaInspecaoDto> areas;
}
