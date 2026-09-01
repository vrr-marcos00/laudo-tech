package com.laudotech.repository;
import com.laudotech.entity.AreaInspecao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AreaInspecaoRepository extends JpaRepository<AreaInspecao, Long> {
    List<AreaInspecao> findByLaudoIdOrderByOrdemAsc(Long laudoId);
}
