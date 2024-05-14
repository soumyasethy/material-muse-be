// app.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3001" })); // Enable CORS for all origins

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const materialSchema = new mongoose.Schema({
  materialId: { type: String, unique: true },
  styleNo: String,
  styleName: String,
  vendor: String,
  tat: String,
  imported: String,
  location: String,
  materialComposition: String,
  weight: String,
  cost: String,
  moq: String,
  type: String,
  subtype: String,
  segment: String,
  images: [String],
  colors: [String],
  features: [String],
});
const Material = mongoose.model("Material", materialSchema);

/**** CURD Operation *****/
app.post("/materials", async (req, res) => {
  const {
    materialId,
    styleNo,
    styleName,
    vendor,
    tat,
    imported,
    location,
    materialComposition,
    weight,
    cost,
    moq,
    type,
    subtype,
    segment,
    images,
    colors,
    features,
  } = req.body;
  const newMaterial = new Material({
    materialId,
    styleNo,
    styleName,
    vendor,
    tat,
    imported,
    location,
    materialComposition,
    weight,
    cost,
    moq,
    type,
    subtype,
    segment,
    images,
    colors,
    features,
  });
  try {
    await newMaterial.save();
    res.status(201).send(newMaterial);
  } catch (error) {
    res.status(400).send(error);
  }
});
// Get all materials
/*app.get("/materials", async (req, res) => {
  const materials = await Material.find();
  res.status(200).send({ count: materials.length, data: materials });
});*/
app.get("/materials", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get page size, default to 10

    const skip = (page - 1) * limit; // Calculate how many items to skip

    const materials = await Material.find().skip(skip).limit(limit); // Apply pagination

    const totalMaterials = await Material.countDocuments(); // Get total count

    res.status(200).json({
      page,
      limit,
      totalItems: totalMaterials,
      totalPages: Math.ceil(totalMaterials / limit),
      data: materials,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Error fetching materials" });
  }
});

// Get a specific material by ID
app.get("/materials/:id", async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    res.send(material);
  } catch (error) {
    res.status(404).send({ message: "Material not found" });
  }
});
app.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q; // Get the search term from query parameter

    // Basic search implementation - customize fields as needed
    const searchRegex = new RegExp(searchTerm, "i"); // Case-insensitive
    const query = {
      $or: [
        { styleNo: searchRegex },
        { styleName: searchRegex },
        { materialComposition: searchRegex },
        { materialId: searchRegex },
        { vendor: searchRegex },
        { tat: searchRegex },
        { imported: searchRegex },
        { location: searchRegex },
        { type: searchRegex },
        { subtype: searchRegex },
        { features: searchRegex },
      ],
    };

    /*** pagination Logic ***/
    const page = parseInt(req.query.page) || 1; // Get page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get page size, default to 10

    const skip = (page - 1) * limit; // Calculate how many items to skip

    const materials = await Material.find(query).skip(skip).limit(limit); // Apply pagination

    const totalMaterials = await Material.countDocuments(); // Get total count

    /*** end of pagination Logic ***/

    // const results = await Material.find(query);
    res.json({
      page,
      limit,
      totalMaterials,
      totalPages: Math.ceil(totalMaterials / limit),
      data: materials,
    });
  } catch (error) {
    res.status(500).send({ message: "Error during search" });
  }
});

//update
app.put("/materials/:id", async (req, res) => {
  try {
    const updatedMaterial = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    res.send(updatedMaterial);
  } catch (error) {
    res.status(404).send({ message: "Material not found" });
  }
});
//delete
app.delete("/materials/:id", async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.send({ message: "Material deleted successfully" });
  } catch (error) {
    res.status(404).send({ message: "Material not found" });
  }
});

app.post("/products/filtered", async (req, res) => {
  try {
    const filters = req.body.filters;

    // Group filters by column
    const groupedFilters = filters.reduce((acc, filter) => {
      const column = filter.column;
      if (!acc[column]) {
        acc[column] = [];
      }
      acc[column].push(filter);
      return acc;
    }, {});

    // Construct query, but only if there are actual filters
    const query =
      Object.keys(groupedFilters).length > 0
        ? {
            $and: Object.keys(groupedFilters).map((column) => {
              if (groupedFilters[column].length > 1) {
                return {
                  $or: groupedFilters[column].map((filter) => ({
                    [column]: { $regex: filter.value, $options: "i" },
                  })),
                };
              } else {
                return {
                  [column]: {
                    $regex: groupedFilters[column][0].value,
                    $options: "i",
                  },
                };
              }
            }),
          }
        : {}; // Empty query if no filters

    /*** pagination Logic ***/
    const page = parseInt(req.query.page) || 1; // Get page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get page size, default to 10

    const skip = (page - 1) * limit; // Calculate how many items to skip

    const materials = await Material.find(query).skip(skip).limit(limit); // Apply pagination

    const totalMaterials = await Material.countDocuments(); // Get total count

    /*** end of pagination Logic ***/

    // const results = await Material.find(query);
    res.json({
      page,
      limit,
      totalMaterials,
      totalPages: Math.ceil(totalMaterials / limit),
      data: materials,
    });
  } catch (error) {
    console.error("Error fetching filtered products:", error);
    res.status(500).json({ error: "Error fetching filtered products" });
  }
});

app.get("/api/proxy-image", async (req, res) => {
  const url = req.query.url; // Get the image URL from the query parameter

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    res.setHeader("Content-Type", contentType);

    // Pipe the converted stream to the response
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching image");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
