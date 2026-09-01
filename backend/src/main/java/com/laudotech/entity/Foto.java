package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "foto")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Foto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "area_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private AreaInspecao area;

    @Column(nullable = false)
    private String url;

    @Column(name = "nome_arquivo")
    private String nomeArquivo;

    private Integer ordem = 0;

    @OneToMany(mappedBy = "foto", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("numero ASC")
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<PontoAnotacao> pontos = new ArrayList<>();
}
