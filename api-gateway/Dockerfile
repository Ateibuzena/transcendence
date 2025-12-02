FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE ${API_GATEWAY_PORT}

CMD ["nginx", "-g", "daemon off;"]
