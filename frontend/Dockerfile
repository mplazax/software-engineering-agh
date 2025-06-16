# --- Etap 1: Budowanie Aplikacji React ---
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    # Kopiujemy package.json i package-lock.json (lub yarn.lock)
    COPY package*.json ./
    
    # Instalujemy zależności
    RUN npm install
    
    # Kopiujemy resztę kodu źródłowego aplikacji
    COPY . .
    
    # Budujemy aplikację w wersji produkcyjnej
    # Folder /app/build będzie zawierał gotowe, statyczne pliki
    RUN npm run build
    
    
    # --- Etap 2: Serwowanie plików przez Nginx ---
    FROM nginx:1.25-alpine
    
    # Usuwamy domyślną konfigurację Nginx
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Kopiujemy naszą własną konfigurację Nginx
    COPY nginx/default.conf /etc/nginx/conf.d/default.conf
    
    # Kopiujemy zbudowane pliki statyczne z etapu "builder"
    # do katalogu, z którego Nginx serwuje pliki
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Uruchamiamy Nginx na pierwszym planie
    CMD ["nginx", "-g", "daemon off;"]