import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Conexión exitosa a la base de datos");
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    process.exit(1); // Salir de la aplicación si no se puede conectar a la base de datos
  }
};
