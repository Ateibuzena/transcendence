FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build   # compila TS -> dist/

EXPOSE ${USER_SERVICE_PORT}

CMD ["sh", "-c", "npx wait-on tcp:user_db:5432 && node dist/main.js"]
