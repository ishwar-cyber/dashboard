# Use Node.js LTS version as base
FROM node:23

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose your server port (default: 8000)
EXPOSE 8000

# Start your app
CMD ["node", "index.js"]
