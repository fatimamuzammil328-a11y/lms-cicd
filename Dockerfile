FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENTRYPOINT ["node", "index.js"]
CMD ["help"]