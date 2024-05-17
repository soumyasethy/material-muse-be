// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3001;
require("dotenv").config(); // Load environment variables from .env

// Enable CORS for all origins
app.use(
  cors({
    origin: `http://localhost:${port}`,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json());

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
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);

    res.status(201).send(newMaterial);
  } catch (error) {
    res.status(400).send(error);
  }
});
app.get("/materials", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get page number, default to 1
    const limit = parseInt(req.query.limit) || 10; // Get page size, default to 10

    const skip = (page - 1) * limit; // Calculate how many items to skip

    const materials = await Material.find().skip(skip).limit(limit); // Apply pagination

    const totalMaterials = await Material.countDocuments(); // Get total count
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
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
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.send(material);
  } catch (error) {
    res.status(404).send({ message: "Material not found" });
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
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.send(updatedMaterial);
  } catch (error) {
    res.status(404).send({ message: "Material not found" });
  }
});
//delete
app.delete("/materials/:id", async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.send({ message: "Material deleted successfully" });
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch search results and their total count in parallel
    const [materials, searchResultsCount] = await Promise.all([
      Material.find(query).skip(skip).limit(limit),
      Material.countDocuments(query), // Count documents matching the search
    ]);
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.json({
      page,
      limit,
      totalMaterials: searchResultsCount, // Total matching the search term
      totalPages: Math.ceil(searchResultsCount / limit),
      data: materials,
    });
  } catch (error) {
    res.status(500).send({ message: "Error during search" });
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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch filtered materials and their total count in parallel
    const [materials, filteredCount] = await Promise.all([
      Material.find(query).skip(skip).limit(limit),
      Material.countDocuments(query), // Count documents matching the filters
    ]);
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    res.json({
      page,
      limit,
      totalMaterials: filteredCount, // Total matching the filter criteria
      totalPages: Math.ceil(filteredCount / limit),
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
    res.header("Access-Control-Allow-Origin", [
      `http://localhost:${port}`,
      // "https://your-production-domain.com",
    ]);
    res.header("Access-Control-Allow-Credentials", true);
    // Pipe the converted stream to the response
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching image");
  }
});

// Assuming you're using Mongoose for MongoDB interactions
app.get("/filter-options", async (req, res) => {
  try {
    const filterableFields = [
      // "materialId",
      "styleNo",
      "styleName",
      "vendor",
      "tat",
      "imported",
      "location",
      "materialComposition",
      "weight",
      "cost",
      "moq",
      "type",
      "subtype",
      "segment",
      // "images",
      "colors",
      "features",
    ]; // List of fields you want to filter on

    const distinctValues = await Promise.all(
      filterableFields.map((field) => Material.distinct(field)) // Fetch distinct values for each field
    );

    const filterOptions = {};
    filterableFields.forEach((field, index) => {
      filterOptions[field] = distinctValues[index];
    });

    res.json(filterOptions); // Send filter options to frontend
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Error fetching filter options" });
  }
});

app.get("/", async (req, res) => {
  try {
    // 1. Get Query Parameters
    const searchTerm = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortField = req.query.sortField || "_id";
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
    const sortOptions = { [sortField]: sortOrder };

    // 2. Extract Filter Columns and Values
    const filters = [];
    for (const key in req.query) {
      if (!["page", "limit", "q", "sortField", "sortOrder"].includes(key)) {
        const column = key.toLowerCase();
        filters.push({
          column,
          values: req.query[key].split(",").map(decodeURIComponent),
        });
      }
    }

    // 3. Build MongoDB Query
    const query = {};

    // Handle search term
    if (searchTerm) {
      const searchRegex = new RegExp(searchTerm, "i");
      query.$or = [
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
      ];
    }

    // Handle filters
    if (filters.length > 0) {
      let andConditions = [];
      filters.forEach((filter) => {
        let filterValues = filter.values.map((value) => new RegExp(value, "i")); // Case-insensitive regex
        let filterConditions = { [filter.column]: { $in: filterValues } };
        andConditions.push(filterConditions);
      });
      query.$and = andConditions;
    }

    // 4. Fetch, Sort, and Count Materials
    const [materials, totalCount] = await Promise.all([
      Material.find(query).sort(sortOptions).skip(skip).limit(limit),
      Material.countDocuments(query),
    ]);

    // 5. Fetch Distinct Values for All Filterable Columns
    const filterableFields = [
      "styleNo",
      "styleName",
      "vendor",
      // "tat",
      // "imported",
      "location",
      "materialComposition",
      // "weight",
      // "cost",
      // "moq",
      "type",
      "subtype",
      "segment",
      "colors",
      // "features",
    ];
    const filterOptions = {};
    await Promise.all(
      filterableFields.map(async (column) => {
        const distinctValues = await Material.distinct(column);
        filterOptions[column] = distinctValues.map((value) => ({
          value: value,
          selected: filters.some(
            (f) => f.column === column && f.values.includes(value)
          ), // Check if selected
        }));
      })
    );

    // 6. Send Response with Materials and Filter Options
    res.json({
      page,
      limit,
      totalMaterials: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      data: materials,
      filterOptions: filterOptions, // Include filter options in the response
    });
  } catch (error) {
    // Enhanced Error Logging
    if (error instanceof mongoose.Error) {
      // Handle Mongoose-specific errors (e.g., validation, cast errors)
      console.error("Mongoose Error:", error.name, error.message);
      res.status(500).json({
        error: "Database Error",
        details: {
          name: error.name,
          message: error.message,
        },
      });
    } else if (error instanceof Error) {
      // Handle general JavaScript errors
      console.error("Server Error:", error.name, error.message, error.stack);
      res.status(500).json({
        error: "Server Error",
        details: {
          name: error.name,
          message: error.message,
        },
      });
    } else {
      // Handle unexpected errors
      console.error("Unknown Error:", error);
      res.status(500).json({ error: "Unknown Error" });
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
