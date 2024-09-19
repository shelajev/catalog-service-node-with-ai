FROM node:20 AS base
WORKDIR /usr/local/app

FROM base AS dev
ENV NODE_ENV=development
CMD ["yarn", "dev-container"]

FROM base AS final
ENV NODE_ENV=production
COPY package.json yarn.lock ./
RUN yarn install && yarn cache clean --force
COPY ./src ./src

EXPOSE 3000

CMD [ "node", "src/index.js" ]