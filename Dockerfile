FROM node:12.18.1-alpine as build

ENV NODE_ENV production

WORKDIR /app
ADD . /app
RUN yarn install --production --skip-integrity-check --non-interactive

CMD ["node", "/app/index.js"]
