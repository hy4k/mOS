FROM node:20-slim

WORKDIR /app

# Install build dependencies for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Pass VITE env vars at build time (either through --build-arg or .env)
# Vite embeds these into the static files during build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG GEMINI_API_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

EXPOSE 3000

# tsx is installed locally in node_modules as a devDependency in this project
CMD ["npx", "tsx", "server.ts"]
