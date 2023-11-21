const express  = require("express")
const app  =express()
const port = process.env.PORT || 5000
require ('dotenv').config()
const cors = require("cors")
const jwt = require("jsonwebtoken")
app.use(cors())
app.use(express.json())
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hxdwxas.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const verifyToken = (req , res ,next) => {
  console.log(req.headers.authorization)
  if(!req.headers.authorization){
  return res.status(401).send({message : "Unauthorized Access"})
  }
 const token = req.headers.authorization.split(' ')[1]
 console.log("verify token is" , token)
 jwt.verify(token , process.env.TOKEN_SECRET , (err , decoded) => {
  if(err){
    return res.status(401).send({message : "Unauthorized Access"})
  }
  req.decoded = decoded;
  next();
 })

}

async function run() {
  try {
  
    const database = client.db("bistroDB")
    const menuCollection = database.collection("allMenu")
    const reviewCollection = database.collection("reviews")
    const cartCollection = database.collection("carts")
    const userCollection = database.collection("users")
    const paymentCollection = database.collection("payments")
    app.get('/allMenu' , async(req ,res) => {
        const cursor = menuCollection.find()
        const result =await cursor.toArray()
        res.send(result)
    })
    app.get('/menu/:id' , async(req ,res) => {
      const id = req.params.id
      const query = {_id : id}
     
      const result = await menuCollection.findOne(query);
      res.send(result);
    
        
    })
   
    app.post('/menu' , async(req ,res) => {
      const menu  = req.body
      const result =await menuCollection.insertOne(menu)
      res.send(result)
    })


    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price*100)
      console.log(amount)
    
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types :['card']
      });
    
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    });

    
    app.patch('/menu/:id', async (req, res) => {
      try {
        const item = req.body;
        const id = req.params.id;
        const filter = { _id: id };
    
        const updatedDoc = {
          $set: {}
        };
    
        if (item.name) {
          updatedDoc.$set.name = item.name;
        }
    
        if (item.category) {
          updatedDoc.$set.category = item.category;
        }
    
        if (item.price) {
          updatedDoc.$set.price = item.price;
        }
    
        if (item.recipe) {
          updatedDoc.$set.recipe = item.recipe;
        }
    
        if (item.image) {
          updatedDoc.$set.image = item.image;
        }
    
        const result = await menuCollection.updateOne(filter, updatedDoc);
    
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    app.delete('/menu/:id' , async(req, res) => {
      const id = req.params.id
      const query = {_id :id}
      const result  =await menuCollection.deleteOne(query)
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
  app.get('/users',verifyToken, async(req ,res) => {
    const cursor = userCollection.find()
    const result = await cursor.toArray()
    res.send(result)
})
app.get('/user/admin/:email' ,verifyToken, async(req, res) => {
   const email = req.params.email
   console.log(req.decoded)
   if(email !== req.decoded?.email){
    
     return res.status(403).send("forbidden")
   }
   const query = {email : email}
   const user = await userCollection.findOne(query)
   let admin = false
   if(user?.role){
    admin = true
   }
   res.send({admin})
})

app.delete('/user/:id' , async(req, res) => {
  const id = req.params.id
  const query = {_id : new ObjectId(id)}
  const result  =await userCollection.deleteOne(query)
  res.send(result)
})
app.get('/payments/:email',verifyToken, async(req ,res) => {
  const cursor = paymentCollection.find()
  const result = await cursor.toArray()
  res.send(result)
})
app.post('/payments' , async(req , res) => {
  const payment = req.body
  const paymentResult =await paymentCollection.insertOne(payment)
  const query = {
    _id: {
      $in:payment?.cartIds?.map(id => new ObjectId(id))
    }
  }
  const deleteResult = await cartCollection.deleteMany(query)
  res.send({paymentResult , deleteResult})
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
app.post('/jwt' , async(req , res) => {
  const user = req.body
  const token = jwt.sign(user , process.env.TOKEN_SECRET)
  res.send({token})
})
   
   console.log("db connected")   
    
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
