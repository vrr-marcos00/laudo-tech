package com.laudotech.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modelo_laudo")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ModeloLaudo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "engenheiro_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Engenheiro engenheiro;

    @Column(nullable = false)
    private String nome;

    private String descricao;

    @OneToMany(mappedBy = "modelo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordem ASC")
    @Builder.Default
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private List<ModeloTopico> topicos = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }
}
