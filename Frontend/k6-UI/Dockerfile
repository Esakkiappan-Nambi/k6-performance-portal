# Node image
FROM node:20

# Working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining files
COPY . .

# Expose Vite port
EXPOSE 5173

# Start React app
CMD ["npm", "run", "dev", "--", "--host"]