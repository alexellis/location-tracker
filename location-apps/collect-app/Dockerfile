#FROM node:0.10
FROM mhart/alpine-node:4

RUN mkdir /app
WORKDIR /app

ADD ./package.json ./package.json
RUN npm install

ADD index.js /app/

ENV PORT 80
EXPOSE 80

CMD ["node", "index.js"]
