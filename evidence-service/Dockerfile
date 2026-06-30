FROM node:18-alpine
RUN apk add --no-cache postgresql-client
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 3003
CMD ["sh", "entrypoint.sh"]
