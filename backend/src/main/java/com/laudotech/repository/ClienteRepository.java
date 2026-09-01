package com.laudotech.repository;
import com.laudotech.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    @Query("SELECT c FROM Cliente c WHERE c.engenheiro.id = :engenheiroId " +
            "AND (LOWER(c.nome) LIKE LOWER(CONCAT('%',:search,'%')) OR c.cnpj LIKE CONCAT('%',:search,'%')) " +
            "ORDER BY c.nome ASC")
    List<Cliente> search(Long engenheiroId, String search);

    List<Cliente> findByEngenheiroIdOrderByNomeAsc(Long engenheiroId);

    boolean existsByEngenheiroIdAndCnpj(Long engenheiroId, String cnpj);

    boolean existsByEngenheiroIdAndNomeIgnoreCase(Long engenheiroId, String nome);
}
