package com.laudotech.repository;
import com.laudotech.entity.LaudoHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LaudoHistoricoRepository extends JpaRepository<LaudoHistorico, Long> {
    List<LaudoHistorico> findByLaudoIdOrderByCreatedAtDesc(Long laudoId);
    void deleteByLaudoId(Long laudoId);
}
