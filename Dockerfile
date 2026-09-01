FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Same-origin by design (backend has no CORS) - the built app calls the API at whatever origin
# served it, so VITE_API_BASE_URL stays empty and nginx below reverse-proxies /api and /tasks.
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8080
EXPOSE 80
