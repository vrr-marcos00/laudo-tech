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
    private String engenheiroEstado;
    private String engenheiroTituloProfissional;
    private String engenheiroEmail;
    private String engenheiroTelefone;
    private Long clienteId;
    private String clienteNome;
    private String clienteCnpj;
    private String clienteEndereco;
    private String clienteCidade;
    private String clienteCep;
    private String clienteFotoUrl;
    private String clienteDescricao;
    private Long modeloId;
    private String status;
    private String numeroArt;
    private String tipoLaudo;
    private LocalDate dataVisita;
    private LocalDate dataEmissao;
    private String quemAcompanhou;
    private String funcaoAcompanhante;
    private Integer versao;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean mostrarCapa;
    private boolean mostrarSumario;
    private boolean mostrarAssinaturaEngenheiro;
    private boolean mostrarAssinaturaCliente;
    private boolean mostrarCapaEmpresa;
    private boolean mostrarDescricaoEmpresa;
    private String logoCapaUrl;
    private String tituloCapa;
    private String subtituloCapa;
    private Long laudoOrigemId;
    private Integer laudoOrigemVersao;
    private List<LaudoTopicoDto> topicos;
    private List<AreaInspecaoDto> areas;
}
