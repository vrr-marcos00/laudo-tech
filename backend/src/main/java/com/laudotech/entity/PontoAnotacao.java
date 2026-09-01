package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ponto_anotacao")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PontoAnotacao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "foto_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Foto foto;

    @Column(nullable = false)
    private Integer numero;

    @Column(name = "x_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal xPct;

    @Column(name = "y_pct", nullable = false, precision = 6, scale = 4)
    private BigDecimal yPct;

    @OneToMany(mappedBy = "ponto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<PontoNr> nrs = new ArrayList<>();
}
