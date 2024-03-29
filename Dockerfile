FROM node:18-alpine
WORKDIR /app
RUN apk add --update --no-cache python3 make g++ ffmpeg && rm -rf /var/cache/apk/*
COPY . /app
RUN npm ci
CMD npm run watch
EXPOSE 3000
