package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "laudo")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Laudo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engenheiro_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Engenheiro engenheiro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_id")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private ModeloLaudo modelo;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Status status = Status.RASCUNHO;

    @Column(name = "numero_art")
    private String numeroArt;

    @Column(name = "data_visita")
    private LocalDate dataVisita;

    @Column(name = "data_emissao")
    private LocalDate dataEmissao;

    @Column(name = "quem_acompanhou")
    private String quemAcompanhou;

    private Integer versao = 1;

    @Column(name = "titulo_capa", length = 500)
    private String tituloCapa = "LAUDO TÉCNICO DAS INSTALAÇÕES ELÉTRICAS";

    @Column(name = "subtitulo_capa")
    private String subtituloCapa = "NR-10";

    @OneToMany(mappedBy = "laudo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<LaudoTopico> topicos = new ArrayList<>();

    @OneToMany(mappedBy = "laudo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<AreaInspecao> areas = new ArrayList<>();

    @Column(name = "mostrar_capa")
    @Builder.Default
    private boolean mostrarCapa = true;

    @Column(name = "mostrar_sumario")
    @Builder.Default
    private boolean mostrarSumario = true;

    @Column(name = "mostrar_assinatura_engenheiro")
    @Builder.Default
    private boolean mostrarAssinaturaEngenheiro = true;

    @Column(name = "mostrar_assinatura_cliente")
    @Builder.Default
    private boolean mostrarAssinaturaCliente = false;

    @Column(name = "logo_capa_url")
    private String logoCapaUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laudo_origem_id")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Laudo laudoOrigem;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { this.createdAt = this.updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    public enum Status { RASCUNHO, FINALIZADO }
}
