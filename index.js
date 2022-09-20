const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port =process.env.PORT|| 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());
const stripe = require("stripe")(
"sk_test_51LjwqjJGxR1uvNyokq6lPx2Rk5L4eBotXyCfABVDM5ah9IovyyZcVFH9EmHUnPt1jG5IJ43VFMDI2pUziSJok8po00bypEeaqJ"
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tczivvu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRATE, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run(){
  try{
    await client.connect();
    const productsCollection = client
      .db("sphere-service")
      .collection("products");
    const usersCollection = client.db("sphere-service").collection("users");
    const reviewCollection = client.db("sphere-service").collection("reviews");
    const ordersCollection = client.db("sphere-service").collection("orders");
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
    //get Users
    app.get("/user", verifyJwt, async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //make Admin
    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    //check Admin
    app.get("/admin/:email", verifyJwt, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
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
    //delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });
    //get user
    app.get("/user", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // update user
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const updatedUser = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: updatedUser,
      };
      const result = await usersCollection.updateMany(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    //Post a review
    app.post("/addreview", async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);
      res.send(result);
    });
    //orders post
    app.post("/order", async (req, res) => {
      const orders = req.body;
      const result = await ordersCollection.insertOne(orders);
      res.send(result);
    });
    app.get("/order", verifyJwt, async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });
    //order by id
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await ordersCollection.findOne(query);
      res.send(order);
    });
    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedOrder = await ordersCollection.updateOne(filter, updatedDoc);
      const result = await paymentCollection.insertOne(payment);
      res.send(updatedDoc);
    });
    //order by email
     app.get("/myorders", async (req, res) => {
       const email = req.query.email;

       const query = { email: email };
       const orders = await ordersCollection.find(query).toArray();
       res.send(orders);
     });
     //payment intent
      app.post('/')
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
