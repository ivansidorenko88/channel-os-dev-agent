FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Dependencies are installed first. Prisma generation is intentionally NOT
# executed during npm install because some hosts copy source files later.
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy runtime sources and Prisma schema before npm start.
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./tsconfig.json

CMD ["npm", "start"]
