FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY bubble-trace/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY bubble-trace/ .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]