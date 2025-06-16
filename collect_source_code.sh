#!/bin/bash

# Nazwa pliku wyjściowego
OUTPUT_FILE="project_source_code.txt"

# Wyczyść plik wyjściowy na początku
> "$OUTPUT_FILE"

echo "Zbieranie kodu źródłowego do pliku '$OUTPUT_FILE'..."

# Znajdź wszystkie odpowiednie pliki, pomijając niechciane katalogi
find . \
    -path './.git' -prune -o \
    -path '*/node_modules' -prune -o \
    -path '*/.venv' -prune -o \
    -path '*/__pycache__' -prune -o \
    -path '*/.ruff_cache' -prune -o \
    -path '*/build' -prune -o \
    -name 'package-lock.json' -prune -o \
    -type f \( \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.py" -o \
        -name "*.css" -o \
        -name "*.html" -o \
        -name "*.json" -o \
        -name "*.yml" -o \
        -name "*.toml" -o \
        -name "*.conf" -o \
        -name "Dockerfile" -o \
        -name ".dockerignore" \
    \) -print0 | while IFS= read -r -d '' file; do
    # Dodaj nagłówek z nazwą pliku
    echo "====================================================================" >> "$OUTPUT_FILE"
    echo "### Plik: $file" >> "$OUTPUT_FILE"
    echo "====================================================================" >> "$OUTPUT_FILE"
    
    # Dodaj zawartość pliku
    cat "$file" >> "$OUTPUT_FILE"
    
    # Dodaj pustą linię dla czytelności
    echo "" >> "$OUTPUT_FILE"
done

echo "Gotowe! Kod źródłowy został zapisany w pliku '$OUTPUT_FILE'."
