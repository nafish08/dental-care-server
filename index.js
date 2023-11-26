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
        const userCollection = client.db('doctors_portal').collection('users');

        // Creating api
        app.get('/appointment_options', async (req, res) => {
            const query = {};
            const cursor = appointmentOptionsCollection.find(query);
            const options = await cursor.toArray();
            res.send(options);
        })

        // user info
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    plot: user,
                },
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.set(result);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            // Get all options
            const options = await appointmentOptionsCollection.find().toArray();

            // Get bookings of that day
            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            //For each option
            options.forEach(option => {
                // Find bookings for this option
                const optionBookings = bookings.filter(book => book.treatment === option.name);
                // select slots for the option bookings
                const bookedSlots = optionBookings.map(book => book.slot);
                // select slots that are not in bookedSlots
                const available = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = available;
            })

            res.send(options);
        })

        // Getting User specific data
        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await bookingCollection.find(query).toArray();
            return res.send(bookings);
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