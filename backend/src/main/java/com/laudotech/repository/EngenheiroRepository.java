package com.laudotech.repository;
import com.laudotech.entity.Engenheiro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface EngenheiroRepository extends JpaRepository<Engenheiro, Long> {
    Optional<Engenheiro> findByEmail(String email);
}
