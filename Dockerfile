FROM node:10.15.3

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN yarn global add node-gyp

RUN apt-get update
RUN apt-get install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

RUN yarn install

COPY . /usr/src/app
# ADD nginx.conf.sigil /

EXPOSE 3000

CMD ["npm", "start"]
