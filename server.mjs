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

// --- MULTER MEMORY STORAGE ---
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- DATABASE SCHEMA ---
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

app.get("/products", async (req, res) => {
    try {
        let result = await productModel.find({}).sort({ createdOn: -1 });
        res.send({ message: "fetch success", data: result });
    } catch (e) {
        res.status(500).send({ message: "fetch error" });
    }
});

app.post("/product", upload.single('productImage'), async (req, res) => {
    try {
        let body = req.body;
        
        // Image conversion to Base64 (Memory storage)
        if (req.file) {
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            body.productImage = base64Image;
        }
        
        let result = await productModel.create(body);
        res.send({ message: "product created", data: result });
    } catch (e) {
        console.error("Server Error:", e);
        res.status(500).send({ message: "upload or database error" });
    }
});

app.delete("/product/:id", async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.params.id);
        res.send({ message: "product deleted" });
    } catch (err) {
        res.status(500).send({ message: "database error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});