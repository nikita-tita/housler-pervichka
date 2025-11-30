FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходники
COPY . .

# Собираем TypeScript
RUN npm run build

# Порт
EXPOSE 3001

# Запуск
CMD ["node", "dist/index.js"]
