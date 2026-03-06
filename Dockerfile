FROM node:20

WORKDIR /app

# copy package.json
COPY package*.json ./

# copy prisma schema first
COPY prisma ./prisma

# install dependencies
RUN npm install

# copy remaining files
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
