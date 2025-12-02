FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${RT_GATEWAY_PORT}

CMD ["node", "dist/main.js"]