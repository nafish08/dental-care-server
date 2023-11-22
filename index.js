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
        const appointmentOptionsCollection = client.db('doctors_portal').collection('appointment_options');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        // Creating api
        app.get('/appointment_options', async (req, res) => {
            const query = {};
            const cursor = appointmentOptionsCollection.find(query);
            const options = await cursor.toArray();
            res.send(options);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date || 'Nov 22, 2023';

            // Get all options
            const options = await appointmentOptionsCollection.find().toArray();

            // Get bookings of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            //For each option, find bookings for that option
            options.forEach(option => {
                const optionBookings = bookings.filter(book => book.treatment === option.name);
                // const booked = optionBookings.map(opt => opt.slot);
                // option.booked = booked;
                option.booked = optionBookings.map(opt => opt.slot);
            })

            res.send(options);
        })

        // add new booking to database
        app.post('/booking', async (req, res) => {
            const booking = req.body; // fetchig booking data from client site
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };
            const alreadyExists = await bookingCollection.findOne(query); // finding data according to query in bookingCollection cluster in database
            if (alreadyExists) {
                return res.send({ success: false, booking: alreadyExists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
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