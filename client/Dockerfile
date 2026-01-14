# Stage 1: Base (Install dependencies)
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Development (For Docker Compose with volumes)
FROM base as dev
# Source code should be mounted here
ENV VITE_API_URL=http://backend:3001
EXPOSE 8085
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8085"]

# Stage 3: Build the React application
FROM base as build
COPY . .
RUN npm run build

# Stage 4: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8085
CMD ["nginx", "-g", "daemon off;"]