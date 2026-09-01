package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modelo_topico")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ModeloTopico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modelo_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private ModeloLaudo modelo;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private Integer ordem = 0;
}
