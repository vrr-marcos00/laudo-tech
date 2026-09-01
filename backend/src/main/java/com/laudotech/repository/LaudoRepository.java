package com.laudotech.repository;
import com.laudotech.entity.Laudo;
import com.laudotech.entity.Laudo.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface LaudoRepository extends JpaRepository<Laudo, Long> {
    @Query("SELECT l FROM Laudo l WHERE l.engenheiro.id = :engenheiroId AND (:status IS NULL OR l.status = :status) AND (:clienteId IS NULL OR l.cliente.id = :clienteId) " +
            "ORDER BY l.createdAt DESC")
    List<Laudo> search(Long engenheiroId, Status status, Long clienteId);
    List<Laudo> findByClienteIdAndEngenheiroIdOrderByCreatedAtDesc(Long clienteId, Long engenheiroId);
    boolean existsByLaudoOrigemId(Long laudoOrigemId);
    boolean existsByClienteId(Long clienteId);
    long countByLogoCapaUrl(String logoCapaUrl);
}
