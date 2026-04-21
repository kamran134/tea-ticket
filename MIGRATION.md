# Migration Plan: GAS → React + Node.js + PostgreSQL + Hetzner

## Причина миграции

Google Apps Script (GAS) работает крайне медленно: чтение из Google Sheets занимает несколько секунд, каждый запрос имеет overhead на холодный старт. При росте нагрузки это станет критичным.

---

## Целевой стек

| Слой | Было | Станет |
|---|---|---|
| Frontend | Vite + Alpine.js + TypeScript | Vite + React + TypeScript + Tailwind CSS |
| Backend | Google Apps Script | Node.js + TypeScript + Express (или Fastify) |
| ORM | — | Prisma |
| База данных | Google Sheets | PostgreSQL |
| Хранилище файлов | Google Drive | Hetzner Object Storage (или local disk) |
| Hosting | GitHub Pages + GAS Web App | Hetzner VPS (Docker + Nginx) |
| Cron | GAS Time-based Trigger | node-cron |
| Auth | SHA256-пароль в коде | JWT (или сессии) |
| CI/CD | Ручной clasp push | GitHub Actions |

---

## Модель данных (PostgreSQL / Prisma)

### Таблица `venues`
```
id          String   @id
name        String
date        DateTime
active      Boolean  @default(true)
createdAt   DateTime @default(now())
```

### Таблица `zones`
```
id          String   @id
venueId     String
name        String
price       Float
cardNumber  String
capacity    Int
sortOrder   Int      @default(0)
venue       Venue    @relation(...)
tickets     Ticket[]
```

### Таблица `tickets`
```
id           String    @id
name         String
phone        String
venueId      String
zoneId       String
zoneName     String
price        Float
receiptLink  String?
status       TicketStatus  @default(BOOKED)
checkedIn    Boolean   @default(false)
createdAt    DateTime  @default(now())
bookedAt     DateTime  @default(now())
groupId      String?
zone         Zone      @relation(...)
```

### Enum `TicketStatus`
```
BOOKED | PENDING | CONFIRMED | REJECTED | EXPIRED
```

---

## API Endpoints (Express)

### GET
- `GET /health` — статус сервиса
- `GET /api/venues` — все мероприятия
- `GET /api/zones?venueId=X` — зоны с доступностью
- `GET /api/tickets/:id` — билет + члены группы
- `GET /api/tickets/group/:groupId` — вся группа

### POST
- `POST /api/register` — регистрация (создание билета + гостей)
- `POST /api/tickets/:id/upload-receipt` — загрузка чека (multipart/form-data)
- `POST /api/tickets/:id/checkin` — check-in одного билета
- `POST /api/tickets/group/:groupId/checkin` — check-in членов группы
- `POST /api/venues` — создать мероприятие
- `POST /api/zones` — создать зону
- `PUT /api/zones/:id` — обновить зону
- `DELETE /api/zones/:id` — удалить зону

---

## Frontend компоненты (React)

| Компонент | Файл | Описание |
|---|---|---|
| `RegisterForm` | `src/components/RegisterForm.tsx` | Форма регистрации с гостями |
| `TicketView` | `src/components/TicketView.tsx` | Статус билета, QR, загрузка чека |
| `AdminScanner` | `src/components/AdminScanner.tsx` | QR-сканер для входа |
| `ManagePanel` | `src/components/ManagePanel.tsx` | Управление мероприятиями и зонами |
| `api.ts` | `src/services/api.ts` | Все HTTP-вызовы к бэкенду |

---

## Инфраструктура (Hetzner)

### docker-compose.yml
```
services:
  db:        postgres:17
  backend:   node:22 (собственный Dockerfile)
  frontend:  nginx (статика из dist/)
  nginx:     reverse proxy + SSL
```

### SSL
- Certbot + Let's Encrypt
- Nginx как reverse proxy: `/api/*` → backend, `/*` → frontend static

### CI/CD (GitHub Actions)
- Push to `main` → build → docker push → ssh deploy

---

## Этапы миграции

- [ ] 1. Инициализация нового проекта (monorepo: `apps/frontend`, `apps/backend`)
- [ ] 2. Backend: Prisma схема + PostgreSQL
- [ ] 3. Backend: Express роуты (все 10 эндпоинтов)
- [ ] 4. Backend: загрузка файлов (Multer)
- [ ] 5. Backend: cron для истечения бронирований
- [ ] 6. Frontend: React компоненты (registerForm, ticketView, adminScanner, managePanel)
- [ ] 7. Frontend: api.ts (замена GAS URL на backend URL)
- [ ] 8. Docker + docker-compose
- [ ] 9. Nginx конфиг + SSL
- [ ] 10. GitHub Actions CI/CD
- [ ] 11. Деплой на Hetzner + тестирование

---

## Принятые решения

| Вопрос | Решение |
|---|---|
| Хранение чеков | Hetzner Object Storage (S3-совместимый) |
| Auth | JWT с `/api/auth/login` эндпоинтом |
| Подтверждение оплаты | UI в ManagePanel (вкладка "Билеты": Pending → Confirmed/Rejected) |
| Домен | Нужен для SSL-сертификата (Let's Encrypt) |

---

## Новая папка проекта

`D:\Work\hobby\tea-ticket-v2\`
