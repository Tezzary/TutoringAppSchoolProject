FROM node:18.16.0-alpine

WORKDIR /app

COPY package*.json ./

COPY .env .

RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]