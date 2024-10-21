# Usa una imagen base oficial de Node.js
FROM node:20

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el package.json y package-lock.json al directorio de trabajo
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto al directorio de trabajo
COPY . .

# Expone el puerto en el que la aplicación se ejecutará
EXPOSE 3007

# Comando para ejecutar la aplicación
CMD ["npm", "dev"]