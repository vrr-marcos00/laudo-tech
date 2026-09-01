package com.laudotech.repository;

import com.laudotech.entity.ModeloLaudo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModeloLaudoRepository extends JpaRepository<ModeloLaudo, Long> {
    List<ModeloLaudo> findByEngenheiroIdOrderByNomeAsc(Long engenheiroId);
}
