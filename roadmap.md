**Faza 1: Minimum Viable Product (MVP) - Sprint 1**

- **Cel:** Umożliwienie podstawowej rezerwacji sal na zajęcia dydaktyczne dla kluczowych użytkowników.
- **Kluczowe Funkcjonalności:**
  - **Logowanie i Autoryzacja:** System logowania dla wykładowców i starostów roku. Rozważenie integracji z istniejącym systemem uwierzytelniania uczelni w przyszłości.
  - **Przeglądanie Dostępności Sal:** Wyświetlanie listy dostępnych sal wraz z ich podstawowymi atrybutami (numer sali, budynek, piętro, liczba miejsc). System powinien pokazywać aktualny stan obciążenia sal.
  - **Wyszukiwanie Sal:** Możliwość wyszukiwania sal na podstawie podstawowych kryteriów, takich jak termin (dzień i przedział czasowy), liczba miejsc oraz typ sali (wykładowa, ćwiczeniowa, komputerowa).
  - **Składanie Zapotrzebowania na Rezerwację:** Zarówno prowadzący, jak i starosta roku mogą inicjować proces rezerwacji. Starosta może zgłosić preferowane terminy studentów.
  - **Wprowadzanie Dostępności:** Prowadzący podaje swoje wolne terminy.
  - **Potwierdzenie Zgodności Studentów:** Starosta roku ma możliwość potwierdzenia zgody studentów na proponowany termin.
  - **Proponowanie Sal:** System na podstawie podanych terminów prowadzącego i studentów oraz atrybutów sal proponuje dostępne sale.
  - **Potwierdzenie Rezerwacji:** Zarówno prowadzący, jak i starosta roku potwierdzają wybraną salę i termin.
  - **Przeglądanie Własnych Rezerwacji:** Każdy użytkownik może przeglądać swoje zainicjowane i potwierdzone rezerwacje.
  - **Administracja Podstawowymi Danymi Sal:** Administrator systemu ma możliwość dodawania, edytowania i usuwania podstawowych informacji o salach oraz ich atrybutów (liczba miejsc, typ).
  - **Blokowanie Sal:** Administrator systemu może tymczasowo blokować sale (np. z powodu remontu).
- **Role Użytkowników i Uprawnienia (MVP):**
  - **Wykładowca (Prowadzący):** Może przeglądać dostępność sal, składać zapotrzebowanie na rezerwację, podawać swoje wolne terminy, wybierać spośród zaproponowanych sal, potwierdzać rezerwacje.
  - **Starosta Roku:** Może przeglądać dostępność sal (wszystkie rezerwacje), podawać wolne terminy studentów, potwierdzać zgodę studentów na proponowany termin.
  - **Administrator Systemu:** Pełny dostęp do zarządzania systemem, użytkownikami (na razie dodawanie/usuwanie ręczne), rolami, salami i ich atrybutami, blokowanie sal.
  - **Pracownik Dziekanatu (Koordynator Sal - Pani Bańdo):** Może przeglądać wszystkie rezerwacje, potencjalnie rezerwować sale (jeśli prowadzący jej oddeleguje to zadanie).

**Faza 2: Rozszerzenie Funkcjonalności - Sprint 2**

- **Cel:** Dodanie kluczowych "nice to have" funkcjonalności i usprawnień.
- **Funkcjonalności:**
  - **Zaawansowane Wyszukiwanie Sal:** Umożliwienie wyszukiwania sal z uwzględnieniem bardziej szczegółowych atrybutów, takich jak specyficzne oprogramowanie, projektor, tablica interaktywna.
  - **Rezerwacje Jednorazowe na Odrabianie Zajęć:** Umożliwienie rezerwowania sal poza regularnym planem zajęć w celu odrobienia nieodbytych zajęć.
  - **Rezerwacje Cykliczne:** Umożliwienie przeniesienia zajęć na stały inny termin w wybrane dni tygodnia przez pozostałą część semestru.
  - **Powiadomienia:** Wprowadzenie systemu powiadomień (np. e-mailowych) o statusie rezerwacji, potwierdzeniach, anulowaniach.
  - **Zarządzanie Atrybutami Sal:** Umożliwienie administratorowi definiowania i przypisywania szczegółowych atrybutów do sal (oprogramowanie, wyposażenie).
  - **Wczytywanie Planów Zajęć:**
    - **Źródło Danych:** Integracja z USOS w celu pobierania aktualnych planów zajęć.
    - **Format Danych:** Analiza możliwości dostępu do danych z USOS (API, eksporty).
    - **Automatyczne Wstępne Wypełnianie Danych (Opcjonalnie):** Wykorzystanie zaimportowanych planów do wstępnego wypełniania informacji o zajęciach przy próbie przeniesienia.
  - **Uwzględnianie Aspektów Ekonomicznych (Podstawowe):** Wprowadzenie mechanizmów preferujących sale i terminy zgodnie z wytycznymi dotyczącymi pracy obsługi sal i unikania pustych okien.
