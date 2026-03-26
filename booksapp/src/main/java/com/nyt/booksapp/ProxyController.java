package com.nyt.booksapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // FIX #3: Permite llamadas desde cualquier origen (ajustar en producción)
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

            // FIX #1: Se eliminó "&language=es-ES" — no es un parámetro válido de la API del NYT
            // y causaba que NYT devolviera 400, lo que se convertía en un 500 aquí.
            String url = baseUrl + path + "?api-key=" + apiKey;
            if (query != null && !query.isEmpty()) {
                url += "&" + query;
            }

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            // FIX #2: Propaga el status code real de NYT (400, 401, 429, etc.)
            // en lugar de siempre devolver 500, facilitando el debugging.
            System.err.println("Error de la API NYT [" + e.getStatusCode() + "]: " + e.getResponseBodyAsString());
            return ResponseEntity
                    .status(e.getStatusCode())
                    .body("{\"error\": \"Error de la API NYT\", \"detalle\": \"" + e.getStatusCode() + "\"}");

        } catch (Exception e) {
            System.err.println("Error interno inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Error interno en el servidor al conectar con NYT\", \"detalle\": \"" + e.getMessage() + "\"}");
        }
    }
}