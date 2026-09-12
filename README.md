<p align="center">
  <img src="src/app/icon.svg" alt="Signal" width="64" height="64" />
</p>

<h1 align="center">Signal</h1>

<p align="center"><strong>Diagnóstico de superficie web en tiempo real</strong></p>

## Descripción

Signal analiza cualquier URL y expone lo que normalmente queda oculto: qué tecnologías corre, qué scripts de terceros carga, qué trackers instala, qué cookies establece y qué tan privada es realmente la conexión.

A diferencia de un analizador que solo lee el HTML crudo, Signal renderiza la página con un navegador headless real, así que ve exactamente lo que ve un visitante: incluyendo todo lo que se inyecta después de la carga inicial vía JavaScript (tags de Google Tag Manager, píxeles de rastreo, scripts diferidos).

## Features

- **Renderizado real, no un fetch.** Cada análisis ejecuta la página en Chromium (Playwright), capturando la actividad de red real durante la carga, no solo el markup inicial.
- **Tecnologías detectadas por firma.** CMS, frameworks, pasarelas de pago, analytics, ad-tech y gestores de consentimiento.
- **Trackers y scripts de terceros** clasificados por dominio, tipo de recurso y volumen de requests.
- **Cookies inspeccionadas desde el navegador**, con flags reales de `Secure`, `HttpOnly` y `SameSite`.
- **Headers de respuesta relevantes**: CSP, HSTS, `X-Frame-Options` y más.
- **Web Vitals reales**: TTFB, LCP y CLS medidos con `PerformanceObserver`, no estimados.
- **Señales de privacidad**: rastreo publicitario, ausencia de CSP, cookies inseguras, posible fingerprinting.
- **Grafo de dependencias interactivo**: arrastra, haz zoom, expande o colapsa nodos para trazar la cadena de carga completa.
- **Vista resumen** en cascada como alternativa rápida al grafo.
- **Tema claro/oscuro** persistente.
