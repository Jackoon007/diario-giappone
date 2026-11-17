# Diario Giappone

Guida e diario del viaggio, consultabile anche offline. Si apre da GitHub Pages e si aggiunge alla schermata Home del telefono.

- `index.html`: l'app (pagina unica).
- `data.json`: i dati del viaggio, cifrati (AES-GCM, chiave da password con PBKDF2). Senza password non sono leggibili.
- `sw.js`: tiene l'app disponibile senza rete.
