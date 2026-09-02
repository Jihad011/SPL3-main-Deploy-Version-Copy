package com.iit.creditmanagement.model.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SSLCommerzInitResponse {

    private String status;
    private String failedreason;

    @JsonProperty("GatewayPageURL")
    private String gatewayPageURL;

    @JsonProperty("storeBanner")
    private String storeBanner;

    @JsonProperty("storeSimpleName")
    private String storeSimpleName;

    private String sessionkey;
}
