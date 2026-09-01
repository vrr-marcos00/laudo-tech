package com.laudotech.repository;

import com.laudotech.entity.NrCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NrCatalogoRepository extends JpaRepository<NrCatalogo, Long> {
    List<NrCatalogo> findByEngenheiroIdOrderByNumeroNrAscArtigoAsc(Long engenheiroId);
}
