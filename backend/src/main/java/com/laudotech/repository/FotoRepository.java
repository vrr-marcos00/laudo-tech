package com.laudotech.repository;
import com.laudotech.entity.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FotoRepository extends JpaRepository<Foto, Long> {
    List<Foto> findByAreaIdOrderByOrdemAsc(Long areaId);
    long countByUrl(String url);
}
