FROM node:18-slim

WORKDIR /app

# Optimization: reduce logs and network noise
RUN npm config set progress false && npm config set loglevel warn

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose Vite port
EXPOSE 5173

# Run dev server with host flag
CMD ["npm", "run", "dev", "--", "--host"]
