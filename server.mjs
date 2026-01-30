import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 999;

// --- DIRECTORY SETUP ---
const uploadDir = path.join(__dirname, 'uploads');

// Check if 'uploads' path exists and handle file/folder conflict
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("System: 'uploads' directory created.");
} else if (fs.lstatSync(uploadDir).isFile()) {
    // Deletes the file named 'uploads' and creates a directory
    fs.unlinkSync(uploadDir);
    fs.mkdirSync(uploadDir);
    console.log("System: 'uploads' file replaced with directory.");
}

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

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

const app = express();
app.use(express.json());
app.use(cors());

// STATIC FILES SERVING
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir));

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
        if (req.file) {
            body.productImage = `/uploads/${req.file.filename}`;
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

// --- SERVER INITIALIZATION ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const dbURI = process.env.MONGO_DB_URL;
mongoose.connect(dbURI);
mongoose.connection.on("connected", () => console.log("Database connected"));
mongoose.connection.on("error", (err) => console.log("Database connection error: ", err));