const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port =process.env.PORT|| 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tczivvu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run(){
  try{
    await client.connect();
    const productsCollection = client
      .db("sphere-service")
      .collection("products");
    const usersCollection = client.db("sphere-service").collection("users");
    const reviewCollection = client.db("sphere-service").collection("reviews");
    //product collction
    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //details
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productsCollection.findOne(query);
      res.send(product);
    });

    //users
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRATE,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });
    //product get post
    //post
    app.post("/addProduct", async (req, res) => {
      const data = req.body;
      const result = await productsCollection.insertOne(data);
      res.send(result);
    });
    //post review
    //Post a review
    app.post("/addreview", async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    });
    //get review
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
  }
  finally{

  }
  console.log("Database connected")

}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running server!");
});

app.listen(port, () => {
  console.log(` listening to port ${port}`);
});
