package com.nyt.booksapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
public class ProxyController {

    @Value("${nyt.api.key}")
    private String apiKey;

    @Value("${nyt.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/**")
    public ResponseEntity<String> proxyToNyt(HttpServletRequest request) {
        try {

            String path = request.getRequestURI().replace("/api", "");
            String query = request.getQueryString();

            String url = baseUrl + path + "?api-key=" + apiKey + "&language=es-ES";
            if (query != null && !query.isEmpty()) {
                url += "&" + query;
            }

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (Exception e) {
            
            e.printStackTrace();
            return ResponseEntity.status(500).body("{\"error\": \"Error interno en el servidor Java al conectar con NYT\"}");
        }
    }
}