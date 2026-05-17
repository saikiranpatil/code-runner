FROM node:alpine

WORKDIR /app

# Install Docker CLI so worker can spawn containers
RUN apk add --no-cache docker-cli

COPY package.json .
RUN npm install

COPY src/ ./src/

CMD ["node", "src/index.js"]