FROM mhart/alpine-node:4

RUN mkdir -p /app/views/
WORKDIR /app

ADD ./package.json ./package.json
RUN npm install

ADD ./views/ ./views/
ADD ./server.js ./

ENV PORT 80
EXPOSE 80

CMD ["node", "server.js"]
