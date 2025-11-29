FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем все зависимости для сборки
RUN npm ci

# Копируем исходники
COPY . .

# Собираем TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Порт
EXPOSE 3001

# Запуск
CMD ["node", "dist/index.js"]
