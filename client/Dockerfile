FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

EXPOSE 5173

# Start in development mode
CMD ["npm", "run", "dev", "--", "--host"]
