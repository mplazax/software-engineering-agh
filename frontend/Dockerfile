# --- Etap 1: Baza z zależnościami ---
FROM node:18-alpine AS deps
WORKDIR /app
# Kopiujemy TYLKO package.json, aby instalacja była czysta
COPY package.json ./
# Uruchamiamy instalację, która stworzy poprawny package-lock.json dla środowiska Alpine Linux
RUN npm install

# --- Etap 2: Środowisko deweloperskie (Vite) ---
FROM deps AS development
WORKDIR /app
# Kopiujemy resztę kodu aplikacji
COPY . .
# Vite wymaga wystawienia portu
EXPOSE 3000
CMD ["npm", "start"]

# --- Etap 3: Budowanie wersji produkcyjnej ---
FROM deps AS builder
WORKDIR /app
COPY . .
# Uruchamiamy budowanie produkcyjne zdefiniowane w package.json
RUN npm run build

# --- Etap 4: Serwer produkcyjny Nginx ---
FROM nginx:1.25-alpine AS production
# Kopiujemy konfigurację Nginx
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# Kopiujemy zbudowane pliki statyczne z etapu "builder"
COPY --from=builder /app/build /usr/share/nginx/html
# Uruchamiamy Nginx
CMD ["nginx", "-g", "daemon off;"]