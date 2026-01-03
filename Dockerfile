FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production
RUN npm run build
# Copy server files, setup script, and pre-built dist
COPY server.js ./
COPY setup-public.sh ./
COPY dist/ ./dist/

# Verify dist exists
RUN if [ ! -f dist/nafsi.js ]; then \
      echo "ERROR: dist/nafsi.js not found. Please run 'npm run build' before building Docker image."; \
      exit 1; \
    fi

# Setup public directory with symbolic links
RUN chmod +x setup-public.sh && bash setup-public.sh

# App port
EXPOSE 4413

# Start app
CMD ["npm", "run", "start"]
