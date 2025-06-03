# User Stories

Poniżej znajdują się User Stories dla projektu Systemu Rezerwacji Sal, podzielone na funkcjonalności MVP (Must Have) oraz Dalszą Część (Nice to Have).

## Faza 1: MVP (Must Have)

### Prowadzący

- **Logowanie:** Jako Prowadzący, chcę móc zalogować się do systemu, aby uzyskać dostęp do harmonogramów i funkcji rezerwacji.
- **Przeglądanie Harmonogramu:** Jako Prowadzący, chcę widzieć aktualny harmonogram zajęć (swój i obłożenie sal), aby wiedzieć, kiedy sale są zajęte.
- **Inicjowanie Zmiany:** Jako Prowadzący, chcę móc zainicjować proces przeniesienia moich cyklicznych zajęć lub rezerwacji terminu na odrobienie jednorazowych zajęć, aby dostosować plan do swoich potrzeb lub odrobić zajęcia.
- **Wskazanie Dostępności:** Jako Prowadzący, chcę móc wskazać swoje wolne terminy ("okienka"), aby system mógł znaleźć pasujący czas na przeniesienie zajęć.
- **Wybór Terminu:** Jako Prowadzący, chcę widzieć listę proponowanych wspólnych terminów (zgodnych z dostępnością studentów i sal) i wybrać jeden, aby dokonać rezerwacji.
- **Oczekiwanie na Potwierdzenie:** Jako Prowadzący, chcę widzieć status mojej prośby o zmianę terminu (oczekuje na potwierdzenie Starosty), aby wiedzieć, na jakim etapie jest proces.
- **Anulowanie Prośby:** Jako Prowadzący, chcę móc anulować moją prośbę o zmianę terminu, zanim zostanie ona potwierdzona przez Starostę.

### Starosta

- **Logowanie:** Jako Starosta, chcę móc zalogować się do systemu, aby reprezentować grupę studentów w procesie zmiany terminów.
- **Przeglądanie Harmonogramu:** Jako Starosta, chcę widzieć aktualny harmonogram zajęć grupy i obłożenie sal, aby podejmować świadome decyzje.
- **Inicjowanie Zmiany:** Jako Starosta, chcę móc (opcjonalnie) zainicjować proces przeniesienia zajęć w imieniu grupy, aby zgłosić potrzebę zmiany.
- **Wskazanie Dostępności Grupy:** Jako Starosta, chcę móc wskazać wolne terminy ("okienka") dla mojej grupy studenckiej, aby system mógł znaleźć pasujący czas na przeniesienie zajęć.
- **Potwierdzenie Zmiany:** Jako Starosta, chcę otrzymać prośbę o potwierdzenie zmiany terminu zaproponowanej przez Prowadzącego i móc ją zaakceptować (potwierdzając zgodę studentów) lub odrzucić, aby sfinalizować rezerwację.

### Koordynator

- **Logowanie:** Jako Koordynator, chcę móc zalogować się do systemu z podwyższonymi uprawnieniami.
- **Pełen Wgląd:** Jako Koordynator, chcę mieć wgląd we wszystkie harmonogramy, rezerwacje i procesy zmian terminów, aby monitorować sytuację.
- **Zarządzanie Rezerwacjami:** Jako Koordynator, chcę móc ręcznie modyfikować lub anulować istniejące rezerwacje, aby rozwiązywać sytuacje konfliktowe lub szczególne przypadki.
- **Ręczne Dodawanie Rezerwacji:** Jako Koordynator, chcę móc ręcznie dodać rezerwację sali (np. na prośbę kogoś spoza systemu lub w nietypowej sytuacji), aby zachować kontrolę nad planem.

### Administrator Systemu

- **Logowanie:** Jako Administrator, chcę móc zalogować się do systemu z pełnymi uprawnieniami.
- **Zarządzanie Użytkownikami:** Jako Administrator, chcę móc dodawać, edytować i usuwać konta użytkowników oraz przypisywać im role, aby zarządzać dostępem do systemu.
- **Zarządzanie Salami:** Jako Administrator, chcę móc dodawać, edytować i usuwać sale oraz zarządzać ich atrybutami (pojemność, typ, oprogramowanie, sprzęt), aby utrzymywać aktualne dane o infrastrukturze.
- **Blokowanie Sal:** Jako Administrator, chcę móc tymczasowo zablokować salę (np. na czas remontu), aby nie była ona dostępna do rezerwacji.
- **Import Początkowy:** Jako Administrator (lub Koordynator), chcę mieć możliwość (choćby przez skrypt/ręcznie w panelu admina) załadowania początkowego planu zajęć, aby system miał dane startowe.

## Faza 2: Dalsza Część (Nice to Have)

- **Automatyczny Import z USOS:** Jako Administrator/Koordynator, chcę, aby system automatycznie importował plany zajęć z USOS, aby oszczędzić czas na ręcznym wprowadzaniu danych.
- **Automatyczna Aktualizacja USOS:** Jako Prowadzący/Starosta, chcę, aby po potwierdzeniu zmiany terminu, nowy termin automatycznie zaktualizował się w USOS, aby zapewnić spójność danych.
- **Powiadomienia o Zmianach:** Jako Użytkownik (Prowadzący, Starosta, Student - jeśli dane dostępne), chcę otrzymywać powiadomienia (email/w aplikacji) o statusie rezerwacji i zmianach w planie, aby być na bieżąco.
- **Eksport do Kalendarza:** Jako Użytkownik, chcę móc wyeksportować mój harmonogram (lub harmonogram grupy) do formatu iCal, aby dodać go do mojego preferowanego kalendarza.
- **Subskrypcja Kalendarza:** Jako Użytkownik, chcę móc subskrybować dynamiczny link do kalendarza, aby zmiany w systemie automatycznie pojawiały się w moim kalendarzu.
- **Zaawansowane Filtrowanie Sal:** Jako Prowadzący/Starosta, chcę móc filtrować sale po szczegółowych atrybutach (np. obecność projektora, konkretne oprogramowanie mniej popularne), aby znaleźć idealnie pasującą salę.
- **Sugestie Optymalizacyjne:** Jako Prowadzący/Starosta, chcę, aby system przy proponowaniu terminów preferował te, które kończą się przed 18:00 lub "doklejają" się do innych zajęć, aby wspierać optymalne wykorzystanie zasobów.
- **Oznaczanie Anulowanych Zajęć:** Jako Prowadzący, chcę móc łatwo oznaczyć zajęcia jako anulowane (np. z powodu choroby) i opcjonalnie od razu zainicjować proces szukania terminu na ich odrobienie.
- **Zgodność z WCAG:** Jako Użytkownik z niepełnosprawnością, chcę móc komfortowo korzystać z systemu zgodnie ze standardami dostępności WCAG.
- **Raporty Wykorzystania Sal:** Jako Koordynator/Administrator, chcę móc generować raporty wykorzystania sal, aby analizować obłożenie i planować zasoby.
