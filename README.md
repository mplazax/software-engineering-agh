# System Rezerwacji Sal dla Wydziału Zarządzania AGH

System Rezerwacji Sal to intuicyjna aplikacja webowa, która usprawnia proces rezerwacji i zmiany terminów zajęć na Wydziale Zarządzania AGH. System zapewnia natychmiastowy wgląd w aktualne obłożenie i specyfikację sal oraz umożliwia wspólne wyszukiwanie pasujących terminów na podstawie dostępności Prowadzącego i grupy studenckiej.

## Funkcjonalności

- Zarządzanie rezerwacjami sal
- Zmiana terminów zajęć
- Wspólne wyszukiwanie pasujących terminów
- Cyfrowa koordynacja między Prowadzącym a Starostą
- Przejrzysty widok dostępności sal
- Zarządzanie użytkownikami i uprawnieniami

## Wymagania systemowe

- Python 3.8+
- Node.js 14+
- PostgreSQL 15
- Docker i Docker Compose (opcjonalnie)

## Struktura projektu

```
.
├── backend/             # Backend aplikacji (FastAPI)
│   ├── routers/        # Endpointy API
│   ├── models/         # Modele danych
│   ├── schemas/        # Schematy Pydantic
│   └── tests/          # Testy
├── frontend/           # Frontend aplikacji (React)
│   ├── src/           # Kod źródłowy
│   └── public/        # Statyczne pliki
└── docker-compose.yml  # Konfiguracja Docker
```

## Technologie

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Python 3.8+

### Frontend

- React
- TypeScript
- Material-UI
- Axios

## Licencja

Ten projekt jest częścią zajęć z Inżynierii Oprogramowania na AGH.

## Autorzy

- Mateusz Bartnicki - Backend
- Piotr Andres - Backend/Baza
- Dominik Dróżdż - Frontend/DevOps
- Maciej Wilewski - Frontend
- Michał Plaza - Backend/PM
