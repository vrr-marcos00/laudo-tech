package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "laudo_historico")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LaudoHistorico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laudo_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Laudo laudo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engenheiro_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Engenheiro engenheiro;

    @Column(name = "status_anterior")
    @Enumerated(EnumType.STRING)
    private Laudo.Status statusAnterior;

    @Column(name = "status_novo", nullable = false)
    @Enumerated(EnumType.STRING)
    private Laudo.Status statusNovo;

    private String observacao;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }
}
