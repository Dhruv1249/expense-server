
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

RUN npm install --production

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]