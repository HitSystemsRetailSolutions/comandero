FROM node:20

WORKDIR /usr/src

COPY ["package.json", "package-lock.json",  "/usr/src/"]

COPY ["./mdb/mdb-vue-ui-kit-3.0.0.tgz", "/usr/src/mdb/"]

RUN npm install

COPY [".", "/usr/src/"]

EXPOSE 3001

CMD [ "npm", "start" ]
