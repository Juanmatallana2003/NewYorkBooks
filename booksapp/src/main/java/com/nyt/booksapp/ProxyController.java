package com.nyt.booksapp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
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
            String fullPath = request.getRequestURI();
            String apiPath = fullPath.substring(fullPath.indexOf("/api") + 4); 
            
            String cleanBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
            String cleanPath = apiPath.startsWith("/") ? apiPath : "/" + apiPath;

            // Construir la URL manualmente (Esto NUNCA falla en ninguna versión de Java)
            String finalUrl = cleanBase + cleanPath + "?api-key=" + apiKey;
                    
            // Agregar otros parámetros si vienen desde el JS (ej: fechas)
            String query = request.getQueryString();
            if (query != null && !query.isEmpty()) {
                finalUrl += "&" + query;
            }

            System.out.println("DEBUG: Pidiendo a NYT -> " + finalUrl);

            return restTemplate.getForEntity(finalUrl, String.class);

        } catch (HttpClientErrorException e) {
            // ¡ESTO ES CLAVE! Si NYT da un error (ej: 404, 401), se lo pasamos intacto a tu JS
            System.err.println("NYT Respondió con error: " + e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
            
        } catch (Exception e) {
            System.err.println("Error interno del Proxy: " + e.getMessage());
            return ResponseEntity.status(500).body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}