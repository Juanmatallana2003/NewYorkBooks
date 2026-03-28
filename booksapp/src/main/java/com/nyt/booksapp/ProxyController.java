package com.nyt.booksapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProxyController {

    @Value("${nyt.api.key}")
    private String apiKey;

    @Value("${nyt.base.url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/**")
    public ResponseEntity<String> proxy(HttpServletRequest request) {
        try {
            // Extraer la ruta (ej: /lists/names.json)
            String path = request.getRequestURI().replace("/api", "");
            
            // Construir la URL manual para evitar errores
            String url = "https://api.nytimes.com/svc/books/v3" + path + "?api-key=" + apiKey;
            
            // Log para ver en Railway exactamente qué estamos pidiendo
            System.out.println("DEBUG: Pidiendo a NYT -> " + url);

            return restTemplate.getForEntity(url, String.class);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            return ResponseEntity.status(500).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}