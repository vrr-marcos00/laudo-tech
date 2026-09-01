package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ponto_nr")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PontoNr {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ponto_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private PontoAnotacao ponto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "nr_catalogo_id", nullable = false)
    private NrCatalogo nrCatalogo;

    @Column(name = "solucao_especifica", columnDefinition = "TEXT")
    private String solucaoEspecifica;
}
