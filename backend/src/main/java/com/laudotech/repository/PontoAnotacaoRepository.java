package com.laudotech.repository;
import com.laudotech.entity.PontoAnotacao;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface PontoAnotacaoRepository extends JpaRepository<PontoAnotacao, Long> {
    List<PontoAnotacao> findByFotoIdOrderByNumeroAsc(Long fotoId);
    void deleteByFotoId(Long fotoId);
}
