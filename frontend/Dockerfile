# --- Etap 1: Baza deweloperska i instalacja zależności ---
    FROM node:18-alpine AS base

    WORKDIR /app
    
    # Kopiujemy tylko pliki manifestu, aby wykorzystać cache Dockera
    COPY package*.json ./
    
    # Instalujemy wszystkie zależności
    RUN npm install
    
    # --- Etap 2: Środowisko deweloperskie (uruchamiane przez docker-compose) ---
    FROM base AS development
    
    # Kopiujemy resztę kodu
    COPY . .
    
    # Uruchamiamy serwer deweloperski Reacta
    CMD ["npm", "start"]
    
    # --- Etap 3: Budowanie wersji produkcyjnej ---
    FROM base AS builder
    
    # Kopiujemy resztę kodu
    COPY . .
    
    # Budujemy aplikację w wersji produkcyjnej
    RUN npm run build
    
    # --- Etap 4: Serwer produkcyjny Nginx ---
    FROM nginx:1.25-alpine AS production
    
    # Usuwamy domyślną konfigurację Nginx
    RUN rm /etc/nginx/conf.d/default.conf
    
    # Kopiujemy naszą własną konfigurację Nginx
    COPY nginx/default.conf /etc/nginx/conf.d/default.conf
    
    # Kopiujemy zbudowane pliki statyczne z etapu "builder"
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Uruchamiamy Nginx na pierwszym planie
    CMD ["nginx", "-g", "daemon off;"]