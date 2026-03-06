FROM node:20

# create working directory
WORKDIR /app

# copy package files first (better caching)
COPY package*.json ./

# install dependencies
RUN npm install

# copy rest of project files
COPY . .

# expose port
EXPOSE 3000

# start server
CMD ["npm", "start"]
