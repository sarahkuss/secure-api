import { hashSync } from "bcrypt";
import jwt from 'jsonwebtoken'
import { db } from "./connect.js";
import { salt, secretKey } from "../serviceAccount.js";

export async function login(req, res) {
  const { email, password } = req.body
  if(!email || !password) {
    res.status(400).send({message: 'Email and password both required'})
    return
  }
  const hashedPassword = hashSync(password, salt)
  const userResults = await db.collection("users")
  .where("email", "==", email.toLowerCase())
  .where("password", "==", hashedPassword)
  .get()
let user = userResults.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0]
if(!user) {
  res.status(401).send({message: "Invalid email or password"})
  return
}
delete user.password
const token = jwt.sign(user, secretKey)
res.send({user, token})
}
// Mongo: let user = await db.collection("users").findOne({ email: email.toLowerCase(), password})

export async function signup(req, res) {
  const { email, password } = req.body
  if(!email || !password) {
    res.status(400).send({message: 'Email and password both required'})
    return
  }
  // Check to see if email already exists
  const check = await db.collection("users").where("email", "==", email.toLowerCase()).get()
  if(check.exists) {
    res.status(401).send({ message: "Email already in use, please try logging in" })
    return
  }
  const hashedPassword = hashSync(password, salt)
  await db.collection("users").add({ email: email.toLowerCase(), password: hashedPassword })
  login(req, res)
}

// Mongo: await db.collection("users").insertOne({ email: email.toLowerCase(), password: hashedPassword })


