FROM node:12-stretch-slim as builder
WORKDIR /app
COPY . ./
RUN ls -la .
RUN npm install
RUN npm run build


FROM node:12-stretch-slim
WORKDIR /app
COPY --from=builder /app/build/ ./build/
COPY server.js package* Dockerfile README.md .* ./
RUN ls -la .
RUN npm install --production
EXPOSE 8080
CMD [ "node", "server.js" ]