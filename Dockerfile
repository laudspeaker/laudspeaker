# To build: docker build -f Dockerfile -t laudspeaker:latest .
# To run: docker run -it -p 80:80 -p 3001:3001 --rm laudspeaker:latest
FROM node:16 as frontend_build
ARG RENDER_EXTERNAL_URL
ARG REACT_APP_POSTHOG_HOST
ARG REACT_APP_POSTHOG_KEY
ENV REACT_APP_API_BASE_URL=${RENDER_EXTERNAL_URL}/api
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

# Serve app
CMD ["node", "dist/src/main.js"]

#Old Version:
# FROM nginx:1.17.8-alpine as final
# RUN apk add --update nodejs nodejs-npm

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}
# ENV PATH /app/node_modules/.bin:$PATH
# WORKDIR /app
# COPY ./nginx/nginx.conf /etc/nginx/conf.d
# COPY ./packages/server/package.json /app
# COPY --from=frontend_build /app/packages/client/build /usr/share/nginx/html
# COPY --from=frontend_build /app/node_modules /app/node_modules
# COPY --from=backend_build /app/packages/server/dist /app/dist
# COPY --from=backend_build /app/node_modules /app/node_modules
# COPY --from=backend_build /app/packages /app/packages
# EXPOSE 80
# EXPOSE 443
# EXPOSE 3001
# CMD ["nginx", "-g", "daemon off;"]
