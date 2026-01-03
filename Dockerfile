FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source files and build configuration
COPY src/ ./src/
COPY webpack.config.js ./
COPY .babelrc ./

# Build the SDK (creates dist/ folder)
RUN npm run build

# Copy server files and setup script
COPY server.js ./
COPY setup-public.sh ./

# Verify dist exists
RUN if [ ! -f dist/nafsi.js ]; then \
      echo "ERROR: dist/nafsi.js not found after build"; \
      exit 1; \
    fi

# Setup public directory with symbolic links
RUN chmod +x setup-public.sh && bash setup-public.sh

# Remove dev dependencies to reduce image size
RUN npm prune --production

# App port
EXPOSE 4413

# Start app
CMD ["npm", "run", "start"]
