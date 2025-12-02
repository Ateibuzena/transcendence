FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${AUTH_SERVICE_PORT}

CMD ["node", "dist/main.js"]
