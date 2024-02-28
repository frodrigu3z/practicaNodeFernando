const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');

const app = express();
const port = 3000;

// Configuración de MySQL
const db = mysql.createConnection({
    host: 'db4free.net',
    user: 'frodr1guez',
    password: 'practicadwes',
    database: 'fernandobbdd'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');
});

app.use(bodyParser.json());

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// CRUD para la tabla 'gorras'
app.get('/gorras', (req, res) => {
    const consulta = 'SELECT * FROM gorras';

    db.query(consulta, (err, results) => {
        if (err) {
            console.error('Error al obtener las gorras: ' + err.message);
            res.status(500).json({ error: 'Error al obtener las gorras' });
            return;
        }

        res.json(results);
    });
});

const multer = require('multer');
const ruta = require('path');

const almacenamiento = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './static/img/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const subidaImagen = multer({ storage: almacenamiento });

app.post('/gorras', subidaImagen.single('imagen'), (req, res) => {
    const { descripcion, marca_id, nombre_imagen, precio } = req.body;
    const imagen = req.file;

    if (!descripcion || !marca_id || !nombre_imagen || !precio) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    const consulta = 'INSERT INTO gorras (descripcion, marca_id, nombre_imagen, imagen, precio, fecha_creacion, fecha_modificacion) VALUES (?, ?, ?, ?, ?, NOW(), NOW())';
    const campos = [descripcion, marca_id, nombre_imagen, ruta.join('/static/img/', imagen.originalname), precio];

    db.query(consulta, campos, (err, results) => {
        if (err) {
            console.error('Error al agregar la gorra: ' + err.message);
            res.status(500).json({ error: 'Error al agregar la gorra' });
            return;
        }

        // Obtener el ID de la gorra recién insertada
        const gorraId = results.insertId;

        // Recuperar la gorra recién insertada para devolverla como respuesta
        const selectConsulta = 'SELECT * FROM gorras WHERE id = ?';
        db.query(selectConsulta, [gorraId], (selectErr, selectResults) => {
            if (selectErr) {
                console.error('Error al obtener la gorra recién insertada: ' + selectErr.message);
                res.status(500).json({ error: 'Error al obtener la gorra recién insertada' });
                return;
            }

            res.status(201).json(selectResults[0]);
        });
    });
});

app.get('/gorras/:id', (req, res) => {
    const gorraId = req.params.id;

    const consulta = 'SELECT * FROM gorras WHERE id = ?';

    db.query(consulta, [gorraId], (err, results) => {
        if (err) {
            console.error('Error al obtener la gorra: ' + err.message);
            res.status(500).json({ error: 'Error al obtener la gorra' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'Gorra no encontrada' });
            return;
        }

        res.json(results[0]);
    });
});

app.put('/gorras/:id', subidaImagen.single('imagen'), (req, res) => {
    // Actualizar una gorra por su ID
    const gorraId = req.params.id;
    const { descripcion, marca_id, nombre_imagen, precio } = req.body;
    const imagen = req.file;

    if (!descripcion || !marca_id || !nombre_imagen || !precio) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    const consulta = 'UPDATE gorras SET descripcion = ?, marca_id = ?, nombre_imagen = ?, imagen = ?, precio = ?, fecha_modificacion = NOW() WHERE id = ?';
    const campos = [descripcion, marca_id, nombre_imagen, ruta.join('/static/img/', imagen.originalname), precio, gorraId];

    db.query(consulta, campos, (err, results) => {
        if (err) {
            console.error('Error al actualizar la gorra: ' + err.message);
            res.status(500).json({ error: 'Error al actualizar la gorra' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Gorra no encontrada' });
            return;
        }

        // Recupera la gorra actualizada para devolverla como respuesta
        const selectConsulta = 'SELECT * FROM gorras WHERE id = ?';
        db.query(selectConsulta, [gorraId], (selectErr, selectResults) => {
            if (selectErr) {
                console.error('Error al obtener la gorra actualizada: ' + selectErr.message);
                res.status(500).json({ error: 'Error al obtener la gorra actualizada' });
                return;
            }

            res.json(selectResults[0]);
        });
    });
});

app.delete('/gorras/:id', (req, res) => {
    // Eliminar una gorra por su ID
    const gorraId = req.params.id;

    const deleteConsulta = 'DELETE FROM gorras WHERE id = ?';
    db.query(deleteConsulta, [gorraId], (err, results) => {
        if (err) {
            console.error('Error al eliminar la gorra: ' + err.message);
            res.status(500).json({ error: 'Error al eliminar la gorra' });
            return;
        }

        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Gorra no encontrada' });
            return;
        }

        res.json({ message: 'Gorra eliminada con éxito' });
    });
});

// Endpoint para ordenar por criterio "/sort/criterio"
app.get('/gorras/sort/:criterio', (req, res) => {
    const { criterio } = req.params;

    const criterios = ['precio', 'fecha_creacion', 'descripcion'];

    if (!criterios.includes(criterio)) {
        res.status(400).json({ error: 'Criterio de orden no válido' });
        return;
    }

    const consulta = `SELECT * FROM gorras ORDER BY ${criterio}`;

    db.query(consulta, (err, results) => {
        if (err) {
            console.error('Error al obtener las gorras ordenadas: ' + err.message);
            res.status(500).json({ error: 'Error al obtener las gorras ordenadas' });
            return;
        }

        res.json(results);
    });
});


// Endpoint para filtrar por marcas "/gorras/marcas"
app.get('/gorras/marcas', (req, res) => {
    // Listar todas las gorras desglosadas por categoría
    const consulta = 'SELECT * FROM marcas';

    db.query(consulta, (err, marcas) => {
        if (err) {
            console.error('Error al obtener las marcas: ' + err.message);
            res.status(500).json({ error: 'Error al obtener las marcas' });
            return;
        }

        const categorias = [];

        // Por cada marca, obtener las gorras asociadas
        marcas.forEach((marca) => {
            const gorrasConsulta = 'SELECT * FROM gorras WHERE marca_id = ?';
            db.query(gorrasConsulta, [marca.id], (gorrasErr, gorras) => {
                if (gorrasErr) {
                    console.error('Error al obtener las gorras de la marca ' + marca.descripcion + ': ' + gorrasErr.message);
                    res.status(500).json({ error: 'Error al obtener las gorras por categoría' });
                    return;
                }

                categorias.push({
                    marca: marca.descripcion,
                    gorras: gorras
                });

                // Si hemos procesado todas las marcas, devolver la respuesta
                if (categorias.length === marcas.length) {
                    res.json(categorias);
                }
            });
        });
    });
});

// Endpoint para crear una vista HTML con los datos (descripción y precio) "/gorras/html"
app.get('/gorras/html', (req, res) => {
    // Crear una vista HTML con los datos
    const consulta = 'SELECT descripcion, precio FROM gorras';

    db.query(consulta, (err, results) => {
        if (err) {
            console.error('Error al obtener las gorras: ' + err.message);
            res.status(500).json({ error: 'Error al obtener las gorras' });
            return;
        }

        res.render('gorras', { gorras: results });
    });
});

// Arrancar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
