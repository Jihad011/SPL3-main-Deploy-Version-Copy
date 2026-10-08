package com.iit.creditmanagement.controller;

import com.iit.creditmanagement.model.dto.request.PaymentInitRequest;
import com.iit.creditmanagement.model.entity.User;
import com.iit.creditmanagement.service.SSLCommerzService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping({"/payment/sslcommerz", "/v1/payment/sslcommerz"})
@RequiredArgsConstructor
@Slf4j
public class SSLCommerzController {

    private final SSLCommerzService sslCommerzService;

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, String>> initiatePayment(
            @AuthenticationPrincipal User userPrincipal,
            @Valid @RequestBody PaymentInitRequest request) {

        String gatewayUrl = sslCommerzService.initiatePayment(userPrincipal.getId(), request.feeId());
        return ResponseEntity.ok(Map.of("gatewayUrl", gatewayUrl));
    }

    @PostMapping(value = "/callback/success", produces = "text/html")
    public String callbackSuccess(@RequestParam MultiValueMap<String, String> payload) {
        log.info("Received SSLCommerz SUCCESS callback: {}", payload);
        String valId = payload.getFirst("val_id");
        String tranId = payload.getFirst("tran_id");
        String cardType = payload.getFirst("card_type");
        String amount = payload.getFirst("amount");

        boolean success = sslCommerzService.processCallbackSuccess(valId, tranId, cardType, amount);

        String status = success ? "success" : "failed";
        return buildRedirectHtml("http://localhost:4200/student/dues?paymentStatus=" + status);
    }

    @PostMapping(value = "/callback/fail", produces = "text/html")
    public String callbackFail(@RequestParam MultiValueMap<String, String> payload) {
        log.warn("Received SSLCommerz FAIL callback: {}", payload);
        return buildRedirectHtml("http://localhost:4200/student/dues?paymentStatus=failed");
    }

    @PostMapping(value = "/callback/cancel", produces = "text/html")
    public String callbackCancel(@RequestParam MultiValueMap<String, String> payload) {
        log.info("Received SSLCommerz CANCEL callback: {}", payload);
        return buildRedirectHtml("http://localhost:4200/student/dues?paymentStatus=cancelled");
    }

    private String buildRedirectHtml(String targetUrl) {
        return "<html><head><script>window.location.href='" + targetUrl + "';</script></head>" +
               "<body><p>Redirecting to application...</p></body></html>";
    }
}
