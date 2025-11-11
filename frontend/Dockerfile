# Use Node 20 base image
FROM node:20

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better build caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose React's default port
EXPOSE 3000

# Start the development server (for hot reload)
CMD ["npm", "start"]
