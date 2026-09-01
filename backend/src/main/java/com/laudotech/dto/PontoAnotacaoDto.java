package com.laudotech.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class PontoAnotacaoDto {
    private Long id;
    private Integer numero;
    @JsonProperty("xPct") private BigDecimal xPct;
    @JsonProperty("yPct") private BigDecimal yPct;
    private List<PontoNrDto> nrs;
}
