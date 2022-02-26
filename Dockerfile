FROM node:current-alpine

ENV NODE_ENV=production

RUN apk add git openssh-client --no-cache && \
    mkdir /app && chown -R node.node /app

WORKDIR /app

USER node

COPY --chown=node:node package*.json ./

RUN npm install --production

COPY . .

CMD ["npm", "start"]
