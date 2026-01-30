import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// --- DATABASE CONNECTION ---
const dbURI = process.env.MONGO_DB_URL;
mongoose.connect(dbURI);
mongoose.connection.on("connected", () => console.log("Database connected ✅"));
mongoose.connection.on("error", (err) => console.log("Database connection error: ", err));

const app = express();
const PORT = process.env.PORT || 10000;

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 
app.use(cors());

// --- MULTER MEMORY STORAGE CONFIG ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- MONGODB SCHEMA ---
const productSchema = new mongoose.Schema({
    productName: String,
    productPrice: Number,
    productImage: String, 
    currencyCode: String,
    numberOfSale: Number,
    rating: Number,
    isFreeShipping: String,
    shopName: String,
    createdOn: { type: Date, default: Date.now },
});
const productModel = mongoose.model("Product", productSchema);

// --- API ENDPOINTS ---

// 1. Get all products
app.get("/products", async (req, res) => {
    try {
        let result = await productModel.find({}).sort({ createdOn: -1 });
        res.send({ message: "fetch success", data: result });
    } catch (e) {
        res.status(500).send({ message: "fetch error" });
    }
});

// 2. Get single product by ID (Required for Edit Form)
app.get("/product/:id", async (req, res) => {
    try {
        let result = await productModel.findById(req.params.id);
        res.send({ message: "fetch success", data: result });
    } catch (e) {
        res.status(500).send({ message: "fetch error" });
    }
});

// 3. Create new product (Base64 Image)
app.post("/product", upload.single('productImage'), async (req, res) => {
    try {
        let body = req.body;
        if (req.file) {
            body.productImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        }
        let result = await productModel.create(body);
        res.send({ message: "product created", data: result });
    } catch (e) {
        res.status(500).send({ message: "creation error" });
    }
});

// 4. Update existing product (Required for Save Changes)
app.put("/product/:id", async (req, res) => {
    try {
        await productModel.findByIdAndUpdate(req.params.id, req.body);
        res.send({ message: "product updated successfully" });
    } catch (e) {
        res.status(500).send({ message: "update error" });
    }
});

// 5. Delete product
app.delete("/product/:id", async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.params.id);
        res.send({ message: "product deleted" });
    } catch (e) {
        res.status(500).send({ message: "delete error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});