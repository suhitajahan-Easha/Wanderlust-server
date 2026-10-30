import express from 'express'
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';


const app=express();
const PORT= 8000;
app.use(cors())
app.use(express.json())


const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoclient=await connectToMongoDB()
const db=mongoclient.db('wanderlast')
const destinationcollection=db.collection('destination')
const bookingcollection=db.collection('bookings')

const verifyjwttoken= async(req,res,next)=>{
  const authHeader=req.headers.authorization;
  console.log(authHeader);
  if(!authHeader){
    return res.status(401).send({msg:'Unauthorized!'})
  }
  const token=authHeader.split(" ")[1]
  if(!token){
   return res.status(401).send({msg:'Unauthorized!'})
  }
  const JWKS =createRemoteJWKSet(new URL(`${process.env.CLIENT_URI}/api/auth/jwks`))
 try{
   const {payload}=await jwtVerify(token,JWKS)
  console.log(payload)
 }
 catch(error)
 {
   return res.status(500).send({msg:'server error!'})
 }
  next()
}


app.post('/add-destination', verifyjwttoken,async (req,res)=>{

  const data=req.body;
  const result=await destinationcollection.insertOne(data)
  console.log(result)
  res.send(result)
  
 
})
app.get('/destination',async (req,res)=>{
  const result=await destinationcollection.find().toArray()
  res.send(result)

})
app.get('/featured-destinations',async (req,res)=>{
  const result=await destinationcollection.find().limit(5).toArray()
  res.send(result)

})

app.get('/destination/:id', verifyjwttoken, async (req,res)=>{
  const {id}=req.params
  const result =await destinationcollection.findOne(
    {_id: new ObjectId(id)}
  )
  
  res.send(result)
})
app.patch('/destination/:id', async (req, res) => {
  const data =req.body;
  const {id}=req.params;
  const result =await destinationcollection.updateOne(
    {_id: new ObjectId(id)},
    {$set:data}
  )
  
  res.send(result);
});
app.delete('/destination/:id', async (req, res) => {
  const {id}=req.params;
  const result =await destinationcollection.deleteOne(
    {_id: new ObjectId(id)}
  )
  res.json(result)
});
app.post('/booking',async (req,res)=>{

  const data=req.body;
  const result=await bookingcollection.insertOne(data)
  console.log(result)
  res.send(result)
})
app.get('/booking/:email',async (req,res)=>{
  const {email}=req.params
  const result=await bookingcollection.find({email:email}).toArray()
  res.send(result)

})
app.delete('/booking/:id',async(req,res)=>{
  const {id}=req.params
  const result=await bookingcollection.deleteOne({_id:id})
  res.send(result)
})


app.get('/',(req,res)=>{
  res.send('serving.....')
})

app.listen(PORT,()=>{
    console.log(`server is running at ${PORT}`)
})
export default app 