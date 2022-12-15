# To build: docker build -f Dockerfile -t laudspeaker:latest .
# To run: docker run -it -p 3000:80 -p 3001:3001 --rm laudspeaker:latest
FROM node:16 as frontend_build
WORKDIR /app
ENV REACT_APP_API_BASE_URL https://api.laudspeaker.com
ENV REACT_APP_POSTHOG_HOST https://app.posthog.com
ENV REACT_APP_POSTHOG_KEY RxdBl8vjdTwic7xTzoKTdbmeSC1PCzV6sw-x-FKSB-k
ENV REACT_APP_API_BASE_URL https://api.laudspeaker.com
ENV PATH /app/node_modules/.bin:$PATH
COPY ./packages/client/package.json /app/
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