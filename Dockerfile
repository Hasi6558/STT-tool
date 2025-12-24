# 1. Use Node image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy rest of the code
COPY . .

# 6. Build Next.js
RUN npm run build

# 7. Expose port
EXPOSE 3000

# 8. Start Next.js
CMD ["npm", "run", "dev"]
