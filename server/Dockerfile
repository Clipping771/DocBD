FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source & prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "src/server.js"]
