package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "laudo_topico")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LaudoTopico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laudo_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Laudo laudo;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private Integer ordem = 0;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Tipo tipo = Tipo.TEXTO;

    public enum Tipo { TEXTO, REGISTRO_FOTOGRAFICO, ITENS_CRITICOS }
}
