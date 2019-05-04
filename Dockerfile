##############################
#  Stage 1: Build React App  #
##############################

FROM node:12-stretch-slim as builder
WORKDIR /app

# CACHE: npm install depends only on package(-lock).json
COPY package*.json ./
RUN npm install

# copy app source files and run build:
COPY src/ ./src/
COPY public/ ./public/
RUN ls -la
RUN npm run build

###########################
#  Stage 2: Build Server  #
###########################

FROM node:12-stretch-slim
WORKDIR /app

# CACHE: npm install depends only on package(-lock).json
COPY package*.json ./
RUN npm install --production

# copy server files:
COPY --from=builder /app/build/ ./build/
COPY server.js README.md ./
RUN ls -la

EXPOSE 8080
CMD [ "node", "server.js" ]