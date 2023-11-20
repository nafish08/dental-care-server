const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express()
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bhkv2dd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();
        // console.log('Database Connection Successful')

        // Connecting to cluster
        const appointmentOptions = client.db('doctors_portal').collection('appointment_options');

        // Creating api
        app.get('/appointment_options', async (req, res) => {
            const query = {};
            const cursor = appointmentOptions.find(query);
            const options = await cursor.toArray();
            res.send(options);
        })
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Doctors Portal')
})

app.listen(port, () => {
    console.log(`Doctors app listening on port ${port}`)
})