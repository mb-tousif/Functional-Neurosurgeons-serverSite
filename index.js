const express = require('express');
const cors = require('cors');
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_USER_PASSWORD}@treatments.iexiu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true,serverApi: ServerApiVersion.v1,});

/**
 * API Naming Convention
 * app.get('/appointment') // get all appointments in this collection. or get more than one or by filter
 * app.get('/appointment/:id') // get a specific appointment 
 * app.post('/appointment') // add a new appointment
 * app.put('/booking/:id') // upsert ==> update (if exists) or insert (if doesn't exist)
 * app.patch('/appointment/:id) //
 * app.delete('/appointment/:id) //
 */

async function run() {
    try{
        await client.connect();
        const treatmentsCollection = client.db("Treatment").collection("diseases");
        const appointmentsCollection = client.db("Treatment").collection("appointments");
        const usersCollection = client.db("Treatment").collection("users");

        app.get("/treatments", async(req, res) => {
          const query = {};
          const cursor = treatmentsCollection.find(query);
          const result = await cursor.toArray();
          res.send(result);
        });
        app.get("/appointment", async (req, res) => {
          const patient = req.query.patient;
          const authorization = req.headers.authorization;
          console.log(authorization);
          const query = { patient: patient };
          const result = await appointmentsCollection.find(query).toArray();
          res.send(result);
          console.log(result);
        });

        app.put('/user/:email', async (req, res) =>{
          const user = req.body
          const email = req.params.email;
          const filter = { email: email };
          const options = { upsert: true };
          const updateDoc = {
            $set: user,
          };
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '5d' });
          console.log(token);
          res.send({result, token});
          // res.send(result, {tokenJWT: token});
        });

        app.post("/appointment", async (req, res)=>{
        const appointment = req.body;
        const query = {
          appointment: appointment.appointment,
          date: appointment.date,
          patient: appointment.patient,
        };
        // console.log(query);
        const exists = await appointmentsCollection.findOne(query);
        // console.log(exists);
        if (exists) {
          return res.send({ success: false, appointment: exists });
        }else{
          const result = await appointmentsCollection.insertOne(appointment);
          return res.send({ success: true, result });
        }
        });
    }
    finally{

    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Happy Coding");
});

app.listen(port, () => {
  console.log("Hello Server!!");
});