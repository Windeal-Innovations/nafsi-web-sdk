FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Install build dependencies temporarily
RUN npm install --only=dev

# Copy source
COPY . .

# Build the SDK
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# App port
EXPOSE 4413

# Start app
CMD ["npm", "run", "start"]
