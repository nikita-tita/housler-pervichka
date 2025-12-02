# Инструкция по деплою

## Сервер

| Параметр | Значение |
|----------|----------|
| **Хостинг** | [reg.ru Cloud](https://cloud.reg.ru/panel/servers/5344931/network) |
| **IP** | 91.229.8.221 |
| **SSH** | `ssh -i ~/.ssh/id_housler root@91.229.8.221` |
| **OS** | Ubuntu |

---

## Проекты на сервере

На сервере размещены **3 независимых проекта**. Каждый использует собственные docker-контейнеры с уникальными именами.

### 1. Agent Housler (agent.housler.ru)

| Параметр | Значение |
|----------|----------|
| **Путь** | `/var/www/agent.housler.ru` |
| **URL** | https://agent.housler.ru |
| **Порт** | 3080 (nginx → frontend/backend) |
| **Docker Compose** | `docker-compose.prod.yml` |

**Контейнеры:**
- `agent-frontend` — Next.js frontend (порт 3000)
- `agent-backend` — Node.js API (порт 3001)
- `agent-postgres` — PostgreSQL + PostGIS
- `agent-redis` — Redis кэш
- `agent-nginx` — Reverse proxy (127.0.0.1:3080)

**Деплой:**
```bash
# С локальной машины (одной командой)
ssh -i ~/.ssh/id_housler root@91.229.8.221 "cd /var/www/agent.housler.ru && git pull && docker compose -f docker-compose.prod.yml up -d --build"

# Или на сервере
cd /var/www/agent.housler.ru
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

### 2. AI Calendar Assistant

| Параметр | Значение |
|----------|----------|
| **Путь** | `/root/ai-calendar-assistant` |
| **Порт** | 8000 |
| **Docker Compose** | `docker-compose.yml` |

**Контейнеры:**
- `ai-calendar-assistant` — Python бот
- `calendar-redis` — Redis
- `radicale-calendar` — CalDAV сервер
- `telegram-bot-polling` — Telegram бот

**Деплой:**
```bash
# С локальной машины
ssh -i ~/.ssh/id_housler root@91.229.8.221 "cd /root/ai-calendar-assistant && git pull && docker compose up -d --build"

# Или на сервере
cd /root/ai-calendar-assistant
git pull
docker compose up -d --build
```

---

### 3. Cian Analyzer (housler.ru)

| Параметр | Значение |
|----------|----------|
| **Путь** | `/root/cian-analyzer` |
| **URL** | https://housler.ru |
| **Порт** | 5000 |
| **Docker Compose** | `docker-compose.yml` |

**Контейнеры:**
- `housler-app` — Python Flask приложение
- `housler-redis` — Redis (порт 6380)

**Деплой:**
```bash
# С локальной машины
ssh -i ~/.ssh/id_housler root@91.229.8.221 "cd /root/cian-analyzer && git pull && docker compose up -d --build"

# Или на сервере
cd /root/cian-analyzer
git pull
docker compose up -d --build
```

---

## Важные правила

### НЕ ДЕЛАТЬ:

```bash
# НЕЛЬЗЯ - удалит данные всех проектов!
docker system prune -a

# НЕЛЬЗЯ - остановит все проекты!
docker stop $(docker ps -q)

# НЕЛЬЗЯ - удалит volumes всех проектов!
docker volume prune
```

### БЕЗОПАСНЫЕ команды:

```bash
# Посмотреть все контейнеры
docker ps -a

# Посмотреть логи конкретного контейнера
docker logs agent-frontend --tail 100

# Перезапустить конкретный контейнер
docker restart agent-frontend

# Пересобрать один проект (ВСЕГДА из папки проекта!)
cd /var/www/agent.housler.ru && docker compose -f docker-compose.prod.yml up -d --build
```

---

## SSH настройка (локальная машина)

Для удобства добавьте в `~/.ssh/config`:

```
Host housler-server
    HostName 91.229.8.221
    User root
    IdentityFile ~/.ssh/id_housler
```

После этого можно подключаться просто:
```bash
ssh housler-server
```

---

## Мониторинг

### Проверка статуса всех контейнеров:
```bash
ssh housler-server "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

### Проверка доступности сайтов:
```bash
curl -s -o /dev/null -w "%{http_code}" https://agent.housler.ru/
curl -s -o /dev/null -w "%{http_code}" https://housler.ru/
```

### Проверка дискового пространства:
```bash
ssh housler-server "df -h /"
```

---

## Логи

```bash
# Agent Housler
docker logs agent-frontend --tail 100 -f
docker logs agent-backend --tail 100 -f

# Calendar Assistant
docker logs ai-calendar-assistant --tail 100 -f

# Cian Analyzer
docker logs housler-app --tail 100 -f
```

---

## Откат изменений

Если деплой сломал проект:

```bash
# 1. Посмотреть последние коммиты
cd /var/www/agent.housler.ru
git log --oneline -5

# 2. Откатиться к предыдущему коммиту
git checkout <commit-hash>

# 3. Пересобрать
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Бэкапы

### Создание бэкапа БД:
```bash
docker exec agent-postgres pg_dump -U housler housler_agent > backup_$(date +%Y%m%d).sql
```

### Восстановление:
```bash
cat backup.sql | docker exec -i agent-postgres psql -U housler housler_agent
```

---

## Структура сервера

```
/root/
├── ai-calendar-assistant/    # Telegram бот календаря
│   └── docker-compose.yml
├── cian-analyzer/            # housler.ru
│   └── docker-compose.yml
└── backups/                  # Бэкапы

/var/www/
├── agent.housler.ru/         # agent.housler.ru (этот проект)
│   ├── docker-compose.yml      # Только БД
│   └── docker-compose.prod.yml # Полный стек
├── housler/                  # Старый проект (не используется?)
└── housler_data/             # Данные
```
