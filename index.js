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
  
    const database = client.db("bistroDB")
    const menuCollection = database.collection("allMenu")
    const reviewCollection = database.collection("reviews")
    const cartCollection = database.collection("carts")
    const userCollection = database.collection("users")
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
   app.post('/users' , async(req , res) => {
    const newUser = req.body
    const user = req.query
    const query = {email: user?.email}
    console.log(query)
    const isExisted  =await userCollection.findOne(query)
    if(isExisted){
      return res.send({massage:"No second time insert in database"})
    }
    const result = await userCollection.insertOne(newUser)
 return res.send(result)
  })
  app.get('/users' , async(req ,res) => {
    const cursor = userCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})
app.delete('/user/:id' , async(req, res) => {
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const result  =await userCollection.deleteOne(query)
  res.send(result)
})
app.patch('/user/admin/:id' , async(req, res) => {
  const id = req.params.id
  const filter = {_id : new ObjectId(id)}
  const options = { upsert: true };

  const updatedUser  = {
    $set : {
      role:'admin'
    }
  }
  const result = await userCollection.updateOne(filter, updatedUser, options);
    
  res.send(result)
})
   
   
   
    
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
