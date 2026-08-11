package br.com.contabilidade.empresa.repository;

import br.com.contabilidade.empresa.domain.ModuloEmpresa;
import br.com.contabilidade.empresa.domain.ResponsavelModuloEmpresa;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResponsavelModuloEmpresaRepository extends JpaRepository<ResponsavelModuloEmpresa, UUID> {

    List<ResponsavelModuloEmpresa> findByEmpresaIdOrderByModuloAsc(UUID empresaId);

    Optional<ResponsavelModuloEmpresa> findByEmpresaIdAndModulo(UUID empresaId, ModuloEmpresa modulo);
}
