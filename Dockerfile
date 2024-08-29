FROM ubuntu:latest

# Set user and working directory
USER root
WORKDIR /home/ubuntu/paimon

# Copy the bot files into the container
COPY . /home/ubuntu/paimon/

# Install dependencies
RUN apt-get update -y && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash && \
    apt-get install -y nodejs

# Install nodemon globally and install project dependencies
RUN npm install -g --force nodemon && \
    npm install

# Register slash commands
# RUN npm run register

# Set the default command to run your bot
CMD ["nodemon", "bot.js"]

# Expose port 3000 if your bot uses it for an HTTP server
EXPOSE 3000