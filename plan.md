# Tea-Ticket — План разработки

## Phase 1: Database Setup ✅
Создание структуры Google Sheets.

**Columns:** `ID`, `Name`, `Phone`, `Zone`, `Price`, `Receipt_Link`, `Status`, `CheckedIn`, `CreatedAt`

- [x] Определить структуру таблицы и типы данных
- [x] Создать Google Sheet с нужными колонками
- [x] Задокументировать SHEET_ID

## Phase 2: GAS API ✅ (foundation)
Написание Google Apps Script бэкенда.

- [x] `doPost(register)` — приём данных из формы регистрации + генерация ID
- [x] `doGet(getTicket)` — отдача статуса билета по ID
- [x] `doPost(checkin)` — изменение статуса Check-In
- [x] CORS — POST через `text/plain` (без preflight)
- [x] Деплой как веб-приложение

## Phase 3: Public Landing ✅
Форма регистрации и загрузки чека.

- [x] Страница с формой (Name, Phone, Zone, Price)
- [x] Загрузка чека (Receipt_Link)
- [x] Отправка данных на GAS API
- [x] Валидация полей
- [x] Состояния загрузки и ошибок

## Phase 4: Ticket View ✅
Страница `/ticket?id=...` с QR-кодом.

- [x] Получение данных билета по ID из GAS
- [x] Отображение информации о билете
- [x] Генерация QR-кода (если Status = "Confirmed")
- [x] Обработка статусов: Pending, Confirmed, Rejected

## Phase 5: Admin Scanner ✅
Секретная страница для проверки QR на входе.

- [x] Сканер камеры через `html5-qrcode`
- [x] Проверка билета по ID через GAS API
- [x] Отметка Check-In (POST на GAS)
- [x] Отображение результата: валидный / уже использован / не найден
- [ ] Защита страницы (секретный URL / пароль) — optional
