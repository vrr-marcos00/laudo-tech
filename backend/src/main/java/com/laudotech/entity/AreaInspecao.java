package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "area_inspecao")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AreaInspecao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laudo_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Laudo laudo;

    @Column(nullable = false)
    private String nome;

    private String descricao;
    private Integer ordem = 0;

    @OneToMany(mappedBy = "area", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<Foto> fotos = new ArrayList<>();
}
