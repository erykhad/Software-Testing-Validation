# Listy zakupów

Aplikacja laboratoryjna do przedmiotu Testowanie oprogramowania. Użytkownik zakłada konto, tworzy listy zakupów i odhacza pozycje. Listę można udostępnić innej osobie: może ona zmieniać tylko status pozycji, bez dodawania, usuwania i zmiany ilości.

Zachowanie powstaje metodyką TDD, w cyklu czerwony–zielony–refaktor. Najpierw test opisuje jedną regułę i pada. Potem dochodzi najmniejszy kod, który ten test spełnia. Na końcu kod jest porządkowany, a test zostaje zielony.

## Stos

- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, TypeScript, Hono
- Baza: SQLite (`better-sqlite3`), zapytania SQL z parametrami
- Zdjęcia pozycji: BLOB w bazie
- Menedżer pakietów: pnpm (workspace)

## Wymagania

- Node.js 22 lub nowszy
- pnpm 12 (`corepack enable` albo instalacja ze strony pnpm)
- Do testów wydajnościowych: [k6](https://k6.io/docs/get-started/installation/)
- Do skanu OWASP ZAP: Docker

## Uruchomienie

```bash
pnpm install
pnpm db:seed
pnpm dev
```

- Aplikacja: http://127.0.0.1:5173
- API: http://127.0.0.1:3000

Baza powstaje w `apps/api/data/app.sqlite`. Ścieżkę zmienia zmienna `DB_PATH`, port API zmienna `PORT`. W produkcji (`NODE_ENV=production`) ciasteczko sesji dostaje flagę `Secure`.

## Uprawnienia

Właściciel listy może ją edytować, usuwać, dodawać i zmieniać pozycje oraz udostępniać ją po adresie e-mail. Osoba, której udostępniono listę, widzi pozycje i może je odhaczać. Nie może zmieniać ilości, dodawać ani usuwać produktów. Obca osoba dostaje odpowiedź 404, żeby nie dało się sprawdzić, czy lista istnieje.

Kupiona pozycja jest na liście przekreślona. Do pozycji można dodać zdjęcie JPEG, PNG lub WebP do 2 MB.

## TDD

Cykle idą od reguł bez bazy i HTTP, przez API, do komponentów. Test akceptacyjny Playwright sprawdza już złożoną ścieżkę. Testy bezpieczeństwa, k6 i ZAP badają gotową aplikację i nie są wewnętrznym krokiem TDD.

| Cykl | Czerwony | Zielony |
|---|---|---|
| Jednostki i ilość | `apps/api/src/domain/units.test.ts` | `units.ts` |
| Uprawnienia właściciela i osoby ze współdzielenia | `apps/api/src/domain/permissions.test.ts` | `permissions.ts` |
| Kolejność pozycji i podsumowanie listy | `apps/api/src/domain/items.test.ts` | `items.ts` |
| Podpis, typ i rozmiar zdjęcia | `apps/api/src/domain/image.test.ts` | `image.ts` |
| Limit prób logowania | `apps/api/src/domain/rateLimit.test.ts` | `rateLimit.ts` |
| Rejestracja, data listy, ilość | `apps/api/src/domain/schemas.test.ts` | `schemas.ts` |
| Sesja, rejestracja, ten sam błąd logowania | `apps/api/src/integration/auth.test.ts` | trasy `auth` |
| CRUD listy, pozycji i zdjęcia | `apps/api/src/integration/lists.test.ts` | trasy list i pozycji |
| Status dla współdzielącego, 403 przy edycji, 404 dla obcej osoby | `apps/api/src/integration/sharing.test.ts` | dostęp i współdzielenie |
| Przekreślenie i ukryta edycja | `apps/web/src/components/ItemRow.test.tsx` | `ItemRow.tsx` |
| Wysłanie pozycji i pusta nazwa | `apps/web/src/components/AddItemForm.test.tsx` | `AddItemForm.tsx` |
| Wejście tylko po zalogowaniu | `apps/web/src/components/ProtectedRoute.test.tsx` | `ProtectedRoute.tsx` |
| Ścieżka dwóch osób | `tests/e2e/specs/shopping.spec.ts` | cała aplikacja |

## Testy

### Jednostkowe

Czysta logika bez bazy i bez przeglądarki: uprawnienia, ilość i jednostki, sortowanie, podsumowanie listy, walidacja zdjęcia, limit prób oraz schematy Zod. Po stronie interfejsu: wiersz pozycji, formularz dodawania, daty, udostępnianie, logowanie i listy.

`pnpm test:unit` liczy pokrycie i kończy się błędem, gdy spadnie poniżej progu. API: 90% instrukcji, 85% gałęzi, 90% funkcji, 95% linii. Front: 90% instrukcji, 80% gałęzi, 90% funkcji, 90% linii. Poza progiem zostają tylko punkty wejścia procesu: `apps/api/src/index.ts` i `apps/web/src/main.tsx`.

```bash
pnpm test:unit
```

### Integracyjne

Vitest woła `app.request()` na bazie SQLite w pamięci. Sprawdzane są rejestracja, sesja, CRUD list i pozycji, zdjęcie oraz reguła współdzielenia (403 przy edycji, 200 przy zmianie statusu).

```bash
pnpm test:integration
```

### Systemowe

Playwright przechodzi aplikację w Chromium: rejestracja, logowanie, utworzenie listy, pozycja ze zdjęciem, przekreślenie, udostępnienie i konto drugiej osoby, które może zmienić tylko status.

```bash
pnpm --filter @shopping/e2e install:browsers
pnpm test:e2e
```

### Wydajnościowe

k6 ma trzy scenariusze: smoke, load i stress. Każdy obejmuje logowanie, `GET /api/lists` i zmianę statusu pozycji. Próg: p95 poniżej 300 ms i mniej niż 1% błędów.

`pnpm test:perf` sam uruchamia API na porcie 3099, podnosi limit logowań (`LOGIN_RATE_LIMIT_MAX`, domyślnie 10 na minutę, w tym przebiegu 100000) i odpala seed oraz wszystkie trzy scenariusze. Osobne scenariusze nadal celują w `http://127.0.0.1:3000`, więc API musi już działać. Adres zmienia `BASE_URL`.

```bash
pnpm test:perf
pnpm --filter @shopping/perf smoke
pnpm --filter @shopping/perf load
pnpm --filter @shopping/perf stress
```

### Bezpieczeństwa

Testy Vitest sprawdzają nagłówki, flagi ciasteczka, brak sesji, limit logowania, wstrzyknięcie SQL, zapis nazwy z payloadem XSS jako JSON, dostęp do cudzej listy i zdjęcia oraz odrzucenie złego albo zbyt dużego pliku.

```bash
pnpm --filter @shopping/security test
pnpm audit --audit-level=high
```

`pnpm test:security` uruchamia oba polecenia.

Skan OWASP ZAP baseline wymaga działającego API:

```bash
pnpm dev:api
pnpm test:zap
```

Skrypt woła `zap-baseline.py` przeciwko `http://127.0.0.1:3000` w sieci hosta, bo API nasłuchuje tylko lokalnie.

## Plan i raport z testów

Sprawozdanie w LaTeX leży w `docs/raport/sprawozdanie.tex`, gotowy PDF obok. Dokument kompiluje [Tectonic](https://tectonic-typesetting.github.io/), który sam pobiera brakujące pakiety:

```bash
tectonic docs/raport/sprawozdanie.tex
```
