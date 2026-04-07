const mongoose = require('mongoose');

const uri = "mongodb+srv://admin:wbZ5GbYOlreDjoXR@cluster0.fxmczfv.mongodb.net/game_web?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)
  .then(() => {
    console.log("CONEXION EXITOSA A MONGODB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("ERROR DE CONEXION:", err.message);
    console.error("DETALLE:", err);
    process.exit(1);
  });
