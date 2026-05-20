# Use lightweight official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy server code
COPY . .

# Expose port
EXPOSE 8080

# Run the app
CMD ["node", "index.js"]
