FROM node:18-alpine3.15

ENV NODE_ENV=production

RUN apk add git openssh-client --no-cache && \
    mkdir /app && chown -R node.node /app

WORKDIR /app

USER node

COPY --chown=node:node package*.json ./

RUN npm install --production

COPY --chown=node:node . .

CMD ["npm", "start"]
