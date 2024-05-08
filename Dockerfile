FROM node:20-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN yarn global add node-gyp

RUN apk update
RUN apk add --no-cache \
  build-base \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

RUN yarn install

COPY . /usr/src/app
# ADD nginx.conf.sigil /

EXPOSE 3000

CMD ["npm", "start"]
