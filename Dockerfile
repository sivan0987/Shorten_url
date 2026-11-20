# 1. A computer with Node 22 already installed
FROM node:22

# 2. All the following commands run inside /app in the box
WORKDIR /app

# 3. Copy only the package list first (changes rarely, so this layer is cached)
COPY package.json package-lock.json ./

# 4. Install exactly the versions from package-lock.json
RUN npm ci

# 5. Copy the rest of the code (changes often, so it comes last)
COPY . .

# 6. Run the server when the box starts.
#    Not "npm start": it reads .env, and .env is not in the image (see .dockerignore).
#    The settings come from docker-compose.yml (environment:) instead.
CMD ["npx", "tsx", "src/server.ts"]
