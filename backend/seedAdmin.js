const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('MONGO_URI no está definido en .env');
      process.exit(1);
    }
    
    console.log('Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('¡Conectado exitosamente!');

    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('La cuenta Admin ya existe. Actualizando contraseña y rol por si acaso...');
      existingAdmin.password = 'admin123';
      existingAdmin.role = 'admin';
      existingAdmin.credits = 999999;
      await existingAdmin.save();
      console.log('¡Cuenta Admin actualizada con éxito!');
    } else {
      console.log('Creando cuenta Admin por primera vez...');
      const adminUser = new User({
        username: 'admin',
        password: 'admin123',
        email: 'admin@multiverso.com',
        role: 'admin',
        credits: 9999999 // Casi 10 millones de monedas
      });
      await adminUser.save();
      console.log('¡Cuenta Admin creada y subida a Atlas exitosamente!');
    }
    
    console.log('Proceso terminado. Ya puedes iniciar sesión como admin en tu juego.');
    process.exit(0);
  } catch (err) {
    console.error('Error al insertar el Admin en Atlas:', err);
    process.exit(1);
  }
};

seedAdmin();
