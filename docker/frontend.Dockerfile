# Frontend Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# In production, we build and serve static files
# RUN npm run build

EXPOSE 3000

# For dev container
CMD ["npm", "run", "dev"]
