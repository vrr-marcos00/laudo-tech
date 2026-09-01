package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nr_catalogo")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NrCatalogo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engenheiro_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Engenheiro engenheiro;

    @Column(name = "numero_nr", nullable = false)
    private String numeroNr;

    private String artigo;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "solucao_padrao", columnDefinition = "TEXT")
    private String solucaoPadrao;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Prioridade prioridade = Prioridade.MEDIO;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }

    public enum Prioridade { CRITICO, ALTO, MEDIO, BAIXO }
}
