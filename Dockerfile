# To build: docker build -f Dockerfile -t laudspeaker/laudspeaker:latest .
# To run: docker run -it -p 80:80 --env-file packages/server/.env --rm laudspeaker/laudspeaker:latest
FROM node:16 as frontend_build
ARG EXTERNAL_URL
ARG REACT_APP_POSTHOG_HOST
ARG REACT_APP_POSTHOG_KEY
ENV REACT_APP_API_BASE_URL=${EXTERNAL_URL}/api
ENV REACT_APP_POSTHOG_HOST=${REACT_APP_POSTHOG_HOST}
ENV REACT_APP_POSTHOG_KEY=${REACT_APP_POSTHOG_KEY}
WORKDIR /app
COPY ./packages/client/package.json /app/
COPY ./package-lock.json /app/
RUN npm install --legacy-peer-deps
COPY . /app
RUN npm run format:client
RUN npm run build:client

FROM node:16 as backend_build
WORKDIR /app
COPY --from=frontend_build /app/packages/client/package.json /app/
COPY ./packages/server/package.json /app
RUN npm install
COPY . /app
RUN npm run build:server

FROM node:16 As final
# Env vars
ENV NODE_ENV=production
ENV ENVIRONMENT=production
ENV SERVE_CLIENT_FROM_NEST=true
ENV CLIENT_PATH=/app/client
ENV PATH /app/node_modules/.bin:$PATH
ENV FRONTEND_URL=${EXTERNAL_URL}
ENV POSTHOG_HOST=https://app.posthog.com
ENV POSTHOG_KEY=phc_tXijmIHCxuV8CnUJUtbXbI7ZivlGIWfxURJwEpP3N9F

# Setting working directory
WORKDIR /app

#Copy package.json from server over
COPY ./packages/server/package.json /app

#Copy over all app files
COPY --from=frontend_build /app/packages/client/build /app/client
COPY --from=backend_build /app/packages/server/dist /app/dist
COPY --from=backend_build /app/node_modules /app/node_modules
COPY --from=backend_build /app/packages /app/packages

#Expose web port
EXPOSE 80

# Run migrations and serve app
CMD ["sh", "-c", "clickhouse-migrations migrate && typeorm-ts-node-commonjs migration:run -d packages/server/src/data-source.ts && node dist/src/main.js"]