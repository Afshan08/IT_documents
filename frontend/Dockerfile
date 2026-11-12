FROM node:20-alpine

# Install Nginx web server
RUN apk add --no-cache nginx

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Configure Nginx
RUN mkdir -p /run/nginx /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Setup runtime entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
