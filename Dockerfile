FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Expose HTTPS port
EXPOSE 443

CMD ["npm", "run", "dev"]