FROM node:22-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

RUN apk update
RUN apk add --no-cache \
  build-base \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev

COPY package.json /usr/src/app
COPY pnpm-lock.yaml /usr/src/app

RUN pnpm install

COPY . /usr/src/app

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
