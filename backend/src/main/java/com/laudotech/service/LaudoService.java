package com.laudotech.service;

import com.laudotech.dto.*;
import com.laudotech.entity.*;
import com.laudotech.entity.Laudo.Status;
import com.laudotech.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.IntStream;

import static com.laudotech.util.TextUtils.isHtmlBlank;

@Service
@RequiredArgsConstructor
public class LaudoService {
    private final LaudoRepository laudoRepo;
    private final ClienteRepository clienteRepo;
    private final ModeloLaudoRepository modeloRepo;
    private final LaudoHistoricoRepository historicoRepo;
    private final AreaInspecaoRepository areaRepo;
    private final FotoRepository fotoRepo;
    private final FileStorageService fileStorageService;

    public List<LaudoDto> listar(String status, Long clienteId, Engenheiro authEng) {
        Status s = (status != null && !status.isBlank()) ? Status.valueOf(status) : null;
        return laudoRepo.search(authEng.getId(), s, clienteId).stream().map(this::toDtoSimple).toList();
    }

    public List<LaudoDto> listarPorCliente(Long clienteId, Engenheiro authEng) {
        return laudoRepo.findByClienteIdAndEngenheiroIdOrderByCreatedAtDesc(clienteId, authEng.getId()).stream().map(this::toDtoSimple).toList();
    }

    @Transactional
    public LaudoDto criar(LaudoRequest req, Engenheiro authEng) {
        Cliente cliente = clienteRepo.findById(req.getClienteId()).orElseThrow();

        Laudo laudo = Laudo.builder()
                .engenheiro(authEng).cliente(cliente)
                .status(Status.RASCUNHO).numeroArt(req.getNumeroArt())
                .dataVisita(req.getDataVisita()).dataEmissao(req.getDataEmissao())
                .quemAcompanhou(req.getQuemAcompanhou()).versao(1)
                .build();

        if (req.getModeloId() != null) {
            ModeloLaudo modelo = modeloRepo.findById(req.getModeloId()).orElseThrow();
            laudo.setModelo(modelo);
            List<LaudoTopico> topicos = IntStream.range(0, modelo.getTopicos().size()).mapToObj(i -> {
                ModeloTopico mt = modelo.getTopicos().get(i);
                return LaudoTopico.builder().laudo(laudo).titulo(mt.getTitulo()).conteudo(mt.getConteudo())
                        .ordem(i).tipo(LaudoTopico.Tipo.TEXTO).build();
            }).toList();
            laudo.getTopicos().addAll(topicos);
        }

        Laudo saved = laudoRepo.save(laudo);
        historicoRepo.save(LaudoHistorico.builder()
                .laudo(saved).engenheiro(authEng)
                .statusNovo(Status.RASCUNHO).observacao("Laudo criado").build());
        return toDto(saved);
    }

    @Transactional
    public LaudoDto atualizar(Long id, LaudoRequest req, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(id).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
        assertEditavel(laudo);
        laudo.setNumeroArt(req.getNumeroArt());
        laudo.setDataVisita(req.getDataVisita());
        laudo.setDataEmissao(req.getDataEmissao());
        laudo.setQuemAcompanhou(req.getQuemAcompanhou());
        if (req.getMostrarCapa() != null) laudo.setMostrarCapa(req.getMostrarCapa());
        if (req.getMostrarSumario() != null) laudo.setMostrarSumario(req.getMostrarSumario());
        if (req.getMostrarAssinaturaEngenheiro() != null) laudo.setMostrarAssinaturaEngenheiro(req.getMostrarAssinaturaEngenheiro());
        if (req.getMostrarAssinaturaCliente() != null) laudo.setMostrarAssinaturaCliente(req.getMostrarAssinaturaCliente());
        if (req.getMostrarCapaEmpresa() != null) laudo.setMostrarCapaEmpresa(req.getMostrarCapaEmpresa());
        if (req.getMostrarDescricaoEmpresa() != null) laudo.setMostrarDescricaoEmpresa(req.getMostrarDescricaoEmpresa());
        if (req.getTituloCapa() != null) laudo.setTituloCapa(req.getTituloCapa());
        if (req.getSubtituloCapa() != null) laudo.setSubtituloCapa(req.getSubtituloCapa());
        return toDto(laudoRepo.save(laudo));
    }

    @Transactional
    public LaudoDto mudarStatus(Long id, String novoStatus, String observacao, Engenheiro engenheiro) {
        Laudo laudo = laudoRepo.findById(id).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, engenheiro);
        Status statusNovo = Status.valueOf(novoStatus);
        validarTransicao(laudo.getStatus(), statusNovo);
        Status statusAnterior = laudo.getStatus();
        laudo.setStatus(statusNovo);
        laudoRepo.save(laudo);
        historicoRepo.save(LaudoHistorico.builder()
                .laudo(laudo).engenheiro(engenheiro)
                .statusAnterior(statusAnterior).statusNovo(statusNovo)
                .observacao(observacao).build());
        return toDto(laudo);
    }

    @Transactional
    public LaudoDto salvarTopicos(Long laudoId, List<LaudoTopicoDto> topicos, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(laudoId).orElseThrow();
        assertAcesso(laudo, authEng);
        assertEditavel(laudo);
        for (LaudoTopicoDto t : topicos) {
            LaudoTopico.Tipo tipoDto = (t.getTipo() != null && !t.getTipo().isBlank())
                    ? LaudoTopico.Tipo.valueOf(t.getTipo()) : LaudoTopico.Tipo.TEXTO;
            boolean tituloVazio = t.getTitulo() == null || t.getTitulo().isBlank();
            boolean conteudoVazio = isHtmlBlank(t.getConteudo());
            if (tipoDto == LaudoTopico.Tipo.TEXTO && (tituloVazio || conteudoVazio)) {
                throw new RuntimeException("Título e conteúdo são obrigatórios para todos os tópicos.");
            }
        }
        laudo.getTopicos().clear();
        List<LaudoTopico> novos = IntStream.range(0, topicos.size()).mapToObj(i -> {
            LaudoTopicoDto t = topicos.get(i);
            LaudoTopico.Tipo tipo = (t.getTipo() != null && !t.getTipo().isBlank())
                    ? LaudoTopico.Tipo.valueOf(t.getTipo()) : LaudoTopico.Tipo.TEXTO;
            return LaudoTopico.builder().laudo(laudo).titulo(t.getTitulo()).conteudo(t.getConteudo())
                    .ordem(i).tipo(tipo).build();
        }).toList();
        laudo.getTopicos().addAll(novos);
        return toDto(laudoRepo.save(laudo));
    }

    @Transactional
    public LaudoDto buscar(Long id, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(id).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
        ensureTopicosEspeciais(laudo);
        return toDto(laudo);
    }

    @Transactional
    public void ensureTopicosEspeciais(Long laudoId) {
        Laudo laudo = laudoRepo.findById(laudoId).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        ensureTopicosEspeciais(laudo);
    }

    private void ensureTopicosEspeciais(Laudo laudo) {
        List<AreaInspecao> areas = areaRepo.findByLaudoIdOrderByOrdemAsc(laudo.getId());
        boolean hasFotos = areas.stream().anyMatch(a -> !a.getFotos().isEmpty());
        boolean hasCriticos = areas.stream()
                .flatMap(a -> a.getFotos().stream())
                .flatMap(f -> f.getPontos().stream())
                .flatMap(p -> p.getNrs().stream())
                .anyMatch(nr -> nr.getNrCatalogo().getPrioridade() == NrCatalogo.Prioridade.CRITICO);

        boolean changed = false;
        int nextOrdem = laudo.getTopicos().size();

        if (hasFotos && laudo.getTopicos().stream().noneMatch(t -> t.getTipo() == LaudoTopico.Tipo.REGISTRO_FOTOGRAFICO)) {
            laudo.getTopicos().add(LaudoTopico.builder()
                    .laudo(laudo).tipo(LaudoTopico.Tipo.REGISTRO_FOTOGRAFICO)
                    .titulo("REGISTRO FOTOGRÁFICO, NÃO CONFORMIDADES E RECOMENDAÇÕES")
                    .ordem(nextOrdem++).build());
            changed = true;
        }
        if (hasCriticos && laudo.getTopicos().stream().noneMatch(t -> t.getTipo() == LaudoTopico.Tipo.ITENS_CRITICOS)) {
            laudo.getTopicos().add(LaudoTopico.builder()
                    .laudo(laudo).tipo(LaudoTopico.Tipo.ITENS_CRITICOS)
                    .titulo("ITENS CRÍTICOS – NECESSIDADE DE AÇÃO IMEDIATA")
                    .ordem(nextOrdem++).build());
            changed = true;
        }
        if (changed) laudoRepo.save(laudo);
    }

    @Transactional
    public LaudoDto atualizarLogoCapa(Long id, String logoUrl, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(id).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
        assertEditavel(laudo);
        laudo.setLogoCapaUrl(logoUrl);
        return toDto(laudoRepo.save(laudo));
    }

    @Transactional
    public LaudoDto criarNovaVersao(Long laudoId, Engenheiro authEng) {
        Laudo origem = laudoRepo.findById(laudoId).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(origem, authEng);

        Laudo nova = Laudo.builder()
                .engenheiro(origem.getEngenheiro()).cliente(origem.getCliente())
                .modelo(origem.getModelo())
                .status(Status.RASCUNHO)
                .numeroArt(origem.getNumeroArt())
                .dataVisita(origem.getDataVisita()).dataEmissao(origem.getDataEmissao())
                .quemAcompanhou(origem.getQuemAcompanhou())
                .versao(origem.getVersao() + 1)
                .laudoOrigem(origem)
                .mostrarCapa(origem.isMostrarCapa())
                .mostrarSumario(origem.isMostrarSumario())
                .mostrarAssinaturaEngenheiro(origem.isMostrarAssinaturaEngenheiro())
                .mostrarAssinaturaCliente(origem.isMostrarAssinaturaCliente())
                .mostrarCapaEmpresa(origem.isMostrarCapaEmpresa())
                .mostrarDescricaoEmpresa(origem.isMostrarDescricaoEmpresa())
                .logoCapaUrl(origem.getLogoCapaUrl())
                .tituloCapa(origem.getTituloCapa())
                .subtituloCapa(origem.getSubtituloCapa())
                .build();

        List<LaudoTopico> topicos = origem.getTopicos().stream()
                .map(t -> LaudoTopico.builder().laudo(nova).titulo(t.getTitulo()).conteudo(t.getConteudo())
                        .ordem(t.getOrdem()).tipo(t.getTipo()).build())
                .toList();
        nova.getTopicos().addAll(topicos);

        for (AreaInspecao areaOrigem : areaRepo.findByLaudoIdOrderByOrdemAsc(origem.getId())) {
            AreaInspecao areaNova = AreaInspecao.builder()
                    .laudo(nova).nome(areaOrigem.getNome()).descricao(areaOrigem.getDescricao())
                    .ordem(areaOrigem.getOrdem()).build();
            for (Foto fotoOrigem : areaOrigem.getFotos()) {
                Foto fotoNova = Foto.builder()
                        .area(areaNova).url(fotoOrigem.getUrl()).nomeArquivo(fotoOrigem.getNomeArquivo())
                        .ordem(fotoOrigem.getOrdem()).build();
                for (PontoAnotacao pontoOrigem : fotoOrigem.getPontos()) {
                    PontoAnotacao pontoNovo = PontoAnotacao.builder()
                            .foto(fotoNova).numero(pontoOrigem.getNumero())
                            .xPct(pontoOrigem.getXPct()).yPct(pontoOrigem.getYPct()).build();
                    for (PontoNr nrOrigem : pontoOrigem.getNrs()) {
                        pontoNovo.getNrs().add(PontoNr.builder()
                                .ponto(pontoNovo).nrCatalogo(nrOrigem.getNrCatalogo())
                                .solucaoEspecifica(nrOrigem.getSolucaoEspecifica()).build());
                    }
                    fotoNova.getPontos().add(pontoNovo);
                }
                areaNova.getFotos().add(fotoNova);
            }
            nova.getAreas().add(areaNova);
        }

        Laudo salvo = laudoRepo.save(nova);
        historicoRepo.save(LaudoHistorico.builder()
                .laudo(salvo).engenheiro(authEng)
                .statusNovo(Status.RASCUNHO)
                .observacao("Versão " + salvo.getVersao() + " criada a partir do laudo #" + origem.getId()
                        + " (versão " + origem.getVersao() + ")")
                .build());
        return toDto(salvo);
    }

    @Transactional
    public void deletar(Long id, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(id).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
        if (laudo.getStatus() != Status.RASCUNHO) {
            throw new RuntimeException("Apenas laudos em rascunho podem ser excluídos.");
        }
        if (laudoRepo.existsByLaudoOrigemId(id)) {
            throw new RuntimeException("Este laudo possui versões derivadas e não pode ser excluído.");
        }

        List<String> fotoUrls = areaRepo.findByLaudoIdOrderByOrdemAsc(id).stream()
                .flatMap(a -> a.getFotos().stream())
                .map(Foto::getUrl)
                .distinct()
                .toList();
        String logoUrl = laudo.getLogoCapaUrl();

        historicoRepo.deleteByLaudoId(id);
        laudoRepo.delete(laudo);

        for (String url : fotoUrls) {
            if (fotoRepo.countByUrl(url) == 0) {
                fileStorageService.delete(url);
            }
        }
        if (logoUrl != null && laudoRepo.countByLogoCapaUrl(logoUrl) == 0) {
            fileStorageService.delete(logoUrl);
        }
    }

    public void assertEditavel(Laudo laudo) {
        if (laudo.getStatus() == Status.FINALIZADO) {
            throw new RuntimeException("Laudo finalizado não pode ser editado. Crie uma nova versão para continuar editando.");
        }
    }

    public void assertAcesso(Long laudoId, Engenheiro authEng) {
        Laudo laudo = laudoRepo.findById(laudoId).orElseThrow(() -> new RuntimeException("Laudo não encontrado"));
        assertAcesso(laudo, authEng);
    }

    public void assertAcesso(Laudo laudo, Engenheiro authEng) {
        if (!laudo.getEngenheiro().getId().equals(authEng.getId())) {
            throw new RuntimeException("Você não tem permissão para acessar este laudo.");
        }
    }

    private void validarTransicao(Status atual, Status novo) {
        if (atual != Status.RASCUNHO || novo != Status.FINALIZADO) {
            throw new RuntimeException("Transição de status inválida: " + atual + " → " + novo);
        }
    }

    private LaudoDto toDtoSimple(Laudo l) {
        return LaudoDto.builder()
                .id(l.getId())
                .engenheiroId(l.getEngenheiro().getId())
                .engenheiroNome(l.getEngenheiro().getNome())
                .engenheiroCrea(l.getEngenheiro().getCrea())
                .clienteId(l.getCliente().getId())
                .clienteNome(l.getCliente().getNome())
                .clienteCnpj(l.getCliente().getCnpj())
                .clienteFotoUrl(l.getCliente().getFotoUrl())
                .clienteDescricao(l.getCliente().getDescricao())
                .modeloId(l.getModelo() != null ? l.getModelo().getId() : null)
                .status(l.getStatus().name())
                .numeroArt(l.getNumeroArt())
                .dataVisita(l.getDataVisita())
                .dataEmissao(l.getDataEmissao())
                .quemAcompanhou(l.getQuemAcompanhou())
                .versao(l.getVersao())
                .mostrarCapa(l.isMostrarCapa())
                .mostrarSumario(l.isMostrarSumario())
                .mostrarAssinaturaEngenheiro(l.isMostrarAssinaturaEngenheiro())
                .mostrarAssinaturaCliente(l.isMostrarAssinaturaCliente())
                .mostrarCapaEmpresa(l.isMostrarCapaEmpresa())
                .mostrarDescricaoEmpresa(l.isMostrarDescricaoEmpresa())
                .logoCapaUrl(l.getLogoCapaUrl())
                .tituloCapa(l.getTituloCapa())
                .subtituloCapa(l.getSubtituloCapa())
                .laudoOrigemId(l.getLaudoOrigem() != null ? l.getLaudoOrigem().getId() : null)
                .laudoOrigemVersao(l.getLaudoOrigem() != null ? l.getLaudoOrigem().getVersao() : null)
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    LaudoDto toDto(Laudo l) {
        List<LaudoTopicoDto> topicos = l.getTopicos().stream()
                .map(t -> LaudoTopicoDto.builder().id(t.getId()).titulo(t.getTitulo()).conteudo(t.getConteudo())
                        .ordem(t.getOrdem()).tipo(t.getTipo().name()).build())
                .toList();
        return toDtoSimple(l).toBuilder().topicos(topicos).build();
    }
}
