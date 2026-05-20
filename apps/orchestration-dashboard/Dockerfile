# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Build application
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

# Copy build artifacts to nginx public dir
COPY --from=build /app/dist /usr/share/nginx/html

# Configure Nginx to listen on port 8080 (required for Cloud Run container port routing)
RUN sed -i 's/listen\(.*\)80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
