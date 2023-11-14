const express  = require("express")
const app  =express()
const port = process.env.PORT || 5000
require ('dotenv').config()
const cors = require("cors")
app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hxdwxas.mongodb.net/?retryWrites=true&w=majority`

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
    const database = client.db("bistroDB")
    const menuCollection = database.collection("allMenu")
    const reviewCollection = database.collection("reviews")
    const cartCollection = database.collection("carts")
    app.get('/allMenu' , async(req ,res) => {
        const cursor = menuCollection.find()
        const result =await cursor.toArray()
        res.send(result)
    })
    app.get('/reviews' , async(req ,res) => {
        const cursor = reviewCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })
   app.post('/carts' , async(req , res) => {
     const cart = req.body
     const result = await cartCollection.insertOne(cart)
     res.send(result)
   })
  //  app.get('/carts' , async(req , res) => {
  //   const cursor = cartCollection.find()
  //   const result = await cursor.toArray()
  //   res.send(result)
  //  })
   app.get('/carts' , async(req, res) => {
     const email = req.query.email
     const query = {email: email}
     const result  =await cartCollection.find(query).toArray()
     res.send(result)
   })
   app.delete('/carts/:id' , async(req, res) => {
     const id = req.params.id
     const query = {_id : new ObjectId(id)}
     const result  =await cartCollection.deleteOne(query)
     res.send(result)
   })
   
   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
  } finally {
    
  }
}
run().catch(console.dir);



app.get('/' , (req , res) => {
    res.send("the server is running")
})
app.listen(port , () => {
    console.log(`The server is running  on port ${port}`)
})
