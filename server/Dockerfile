# Use official Node.js v18 image
FROM node:18

# Set working directory inside container
WORKDIR /usr/src/app

# Copy server code
COPY . .

# Install dependencies
RUN npm install

# Expose server port
EXPOSE 5000

# Start the server
CMD ["node", "app.js"]