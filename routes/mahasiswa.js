const express = require('express');
const router = express.Router();

const fs = require('fs')

const multer = require('multer')
const path = require('path')

//import express-validator
const { body, validationResult } = require('express-validator');

//import database
const connection = require('../config/db');


const storage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})


const fileFilter = (req, file, cb) => {
    //mengecheck jenis file yang diizinkan (misalnya, hanya gambar JPEG atau PNG)
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'application/pdf'){
        cb(null, true); //izinkan file
    } else {
        cb(new Error('Jenis file tidak diizinkan'), false); //Tolak file
    }
};

const upload = multer({storage: storage, fileFilter: fileFilter })


router.get('/', function (req,res){
    connection.query('SELECT a.nama, b.nama_jurusan as jurusan ' +
    ' from mahasiswa a join jurusan b' +
    ' on b.id_j=a.id_jurusan ORDER BY a.id_m DESC ', function(err, rows){
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Failed',
            })
        }else{
            return res.status(200).json({
                status: true,
                message: 'Data Mahasiswa',
                data: rows
            })
        }
    })
});


router.post('/create', [
    // Validation
    body('nama').notEmpty(),
    body('nrp').notEmpty(),
    body('jurusan').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    let data = {
        nama: req.body.nama,
        nrp: req.body.nrp,
        id_jurusan: req.body.jurusan
    };
    connection.query('INSERT INTO mahasiswa SET ?', data, function (err, result) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            });
        } else {
            return res.status(201).json({
                status: true,
                message: 'Data Mahasiswa berhasil ditambahkan',
                insertedId: result.insertId
            });
        }
    });
});



router.get('/(:id)', function (req, res){
    let id = req.params.id;
    
    connection.query(`SELECT * FROM mahasiswa WHERE id_m = ${id}`, function(err, rows) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }
        if (rows.length <= 0) {
            return res.status(404).json({
                status: false,
                message: 'Not Found',
            })
        }
        else{
            return res.status(200).json({
                status: true,
                message: 'Data Mahasiswa',
                data: rows[0]
            })
        }
    })
})


router.patch('/update/:id', [
    body('nama').notEmpty(),
    body('nrp').notEmpty(),
    body('jurusan').notEmpty() 
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    let id = req.params.id;
    let data = {
        nama: req.body.nama,
        nrp: req.body.nrp,
        id_jurusan: req.body.jurusan
    };
    connection.query('UPDATE mahasiswa SET ? WHERE id_m = ?', [data, id], function (err, result) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            });
        } else if (result.affectedRows === 0) {
            return res.status(404).json({
                status: false,
                message: 'Data Mahasiswa tidak ditemukan',
            });
        } else {
            return res.status(200).json({
                status: true,
                message: 'Data Mahasiswa berhasil diperbarui',
            });
        }
    });
});

//modul 6 ==> modul 13
router.delete('/delete/:id', function(req, res){
    let id = req.params.id;
    
    connection.query(`SELECT * FROM  mahasiswa WHERE id_m = ${id}`, function (err, rows) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            });
        }if (rows.length ===0) {
            return res.status(404).json({
                status: false,
                message: 'Data Mahasiswa tidak ditemukan',
            });
        }
        const namaFileLama = rows[0].gambar;

        //hapus file lama jika ada
        if (namaFileLama) {
            const pathFileLama = path.join(__dirname, '../public/images', namaFileLama);
            fs.unlinkSync(pathFileLama);
        }

        connection.query(`DELETE FROM mahasiswa WHERE id_m = ${id}`,  function(err, rows) {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                })
            } else {
                return res.status(200).json({
                    status: true,
                    message: 'Delete Success..!',
                })
            }
        })
    })
})


//modul 11


router.post('/store', upload.single("gambar"), [
    //validation
    body('nama').notEmpty(),
    body('nrp').notEmpty(),
    body('id_jurusan').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    let Data = {
        nama: req.body.nama,
        nrp: req.body.nrp,
        id_jurusan: req.body.id_jurusan,
        gambar: req.file.filename
    }
    connection.query('INSERT INTO mahasiswa SET ?', Data, function (err, result) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            });
        } else {
            return res.status(201).json({
                status: true,
                message: 'Data Mahasiswa berhasil ditambahkan',
                insertedId: result.insertId
            });
        }
    });
});

//modul 12
router.patch('/updateGambar/:id', upload.single("gambar"), [
    //validation
    body('nama').notEmpty(),
    body('nrp').notEmpty(),
    body('id_jurusan').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            errors: errors.array()
        });
    }
    let id = req.params.id;
        //lakukan check apakah ada file yang diunggah
    let gambar = req.file ? req.file.filename : null;
    connection.query(`SELECT * FROM  mahasiswa WHERE id_m = ${id}`, function (err, rows) {
        if (err) {
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            });
        }if (rows.length ===0) {
            return res.status(404).json({
                status: false,
                message: 'Data Mahasiswa tidak ditemukan',
            });
        }
        const namaFileLama = rows[0].gambar;

        //hapus file lama jika ada
        if (namaFileLama && gambar) {
            const pathFileLama = path.join(__dirname, '../public/images', namaFileLama);
            fs.unlinkSync(pathFileLama);
        }

        let Data = {
            nama: req.body.nama,
            nrp: req.body.nrp,
            id_jurusan: req.body.id_jurusan,
            gambar : gambar
        };
        connection.query(`UPDATE mahasiswa SET ? WHERE id_m = ${id}`, Data, function (err, rows) {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                });
            } else {
                return res.status(200).json({
                    status: true,
                    message: 'Data Mahasiswa berhasil diperbarui',
                });
            }
        });
    });
});



module.exports = router;