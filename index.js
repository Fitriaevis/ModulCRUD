const express = require('express') // membuat variable baru dengan nama express
const app = express() // membuat variable baru dengan nama app yang isinya express
const port = 3000 // membuat variable dengan nama port yang isinya 3000

// app.get('/', (req,res)=>{
//     res.send('Halo Saya Fitria Evi Susana')
// })

const bodyPs = require('body-parser'); // import body-parser
app.use(bodyPs.urlencoded({ extended: false }));
app.use(bodyPs.json());


//import route posts
const mhsRouter = require('./routes/mahasiswa');
app.use('/api/mhs', mhsRouter);

//listen express.js kedalam port 
app.listen(port, () => {
    console.log(`aplikasi akan berjalan di http://localhost${port}`)
})