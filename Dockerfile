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
COPY setup-public.sh ./

# Build the SDK (creates dist/ folder and runs postbuild → setup-public.sh)
RUN npm run build

# Copy server files
COPY server.js ./

# Verify dist and public directory exist
RUN if [ ! -f dist/nafsi.js ]; then \
      echo "ERROR: dist/nafsi.js not found after build"; \
      exit 1; \
    fi && \
    if [ ! -f public/v1/nafsi.js ]; then \
      echo "ERROR: public/v1/nafsi.js symlink not created"; \
      exit 1; \
    fi

# Remove dev dependencies to reduce image size
RUN npm prune --production

# App port
EXPOSE 4413

# Start app
CMD ["npm", "run", "start"]
