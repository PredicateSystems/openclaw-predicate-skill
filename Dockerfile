# Dockerfile for testing predicate-snapshot skill with OpenClaw
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install OpenClaw globally
RUN npm install -g openclaw

# Create OpenClaw skills directory
RUN mkdir -p /root/.openclaw/skills/predicate-snapshot

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy built skill to OpenClaw skills directory
RUN cp -r dist /root/.openclaw/skills/predicate-snapshot/ && \
    cp package.json /root/.openclaw/skills/predicate-snapshot/ && \
    cp SKILL.md /root/.openclaw/skills/predicate-snapshot/ && \
    cp README.md /root/.openclaw/skills/predicate-snapshot/ && \
    cd /root/.openclaw/skills/predicate-snapshot && npm install --omit=dev

# Copy test scripts
COPY test-skill.ts ./
COPY test-openclaw-integration.sh ./

# Default command - run the login demo
CMD ["npm", "run", "demo:login"]
