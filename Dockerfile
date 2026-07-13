FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./tsconfig.json
COPY start.js ./start.js

CMD ["node", "start.js"]
