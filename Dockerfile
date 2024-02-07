# Stage 1
FROM node:14.19.0-slim
ENV WORK=/app
WORKDIR ${WORK}
COPY package.json package-lock.json ${WORK}/
RUN npm install
RUN apt-get update && \
    apt-get install --yes --no-install-recommends curl
# If you are building your code for production
RUN npm ci --only=production
COPY . .
