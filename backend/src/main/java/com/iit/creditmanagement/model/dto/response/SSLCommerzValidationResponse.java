package com.iit.creditmanagement.model.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SSLCommerzValidationResponse {

    private String status;

    @JsonProperty("tran_date")
    private String tranDate;

    @JsonProperty("tran_id")
    private String tranId;

    @JsonProperty("val_id")
    private String valId;

    private String amount;

    @JsonProperty("store_amount")
    private String storeAmount;

    private String currency;

    @JsonProperty("bank_tran_id")
    private String bankTranId;

    @JsonProperty("card_type")
    private String cardType;

    @JsonProperty("card_no")
    private String cardNo;

    @JsonProperty("card_issuer")
    private String cardIssuer;

    @JsonProperty("card_brand")
    private String cardBrand;

    @JsonProperty("card_sub_brand")
    private String cardSubBrand;

    @JsonProperty("card_issuer_country")
    private String cardIssuerCountry;

    private String risk_level;
    private String risk_title;
}
