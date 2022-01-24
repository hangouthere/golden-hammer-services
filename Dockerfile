FROM node:current-alpine

ENV NODE_ENV=production

RUN mkdir /app && chown -R node.node /app
WORKDIR /app

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm install --production

COPY . .

CMD ["npm", "start"]
