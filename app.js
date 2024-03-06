const express = require("express");
const axios = require("axios");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

const filterResponses = (responses, filters) => {
  return responses.filter((response) =>
    filters.every((filter) => {
      const question = response.questions.find((q) => q.id === filter.id);
      if (!question) return false;

      const value =
        typeof question.value === "string"
          ? question.value.toLowerCase()
          : question.value;
      const filterValue =
        typeof filter.value === "string"
          ? filter.value.toLowerCase()
          : filter.value;

      switch (filter.condition) {
        case "equals":
          return value === filterValue;
        case "does_not_equal":
          return value !== filterValue;
        case "greater_than":
          return value > filterValue;
        case "less_than":
          return value < filterValue;
        default:
          return false;
      }
    })
  );
};

app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const { formId } = req.params;
    const { limit = 150, offset = 0, sort = "asc", filters } = req.query;

    const allResponses = [];
    let hasMore = true;
    let currentOffset = 0;
    try {
      while (hasMore) {
        const response = await axios.get(`${BASE_URL}/${formId}/submissions`, {
          headers: { Authorization: `Bearer ${API_KEY}` },
          params: { limit: 150, offset: currentOffset, sort },
        });

        allResponses.push(...response.data.responses);
        hasMore = response.data.responses.length === 150;
        currentOffset += 150;
      }
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }

    const filtersObj = filters ? JSON.parse(filters) : [];
    const filteredResponses = filterResponses(allResponses, filtersObj);

    const paginatedResponses = filteredResponses.slice(
      offset,
      parseInt(offset) + parseInt(limit)
    );
    res.json({
      totalResponses: filteredResponses.length,
      pageCount: Math.ceil(filteredResponses.length / limit),
      responses: paginatedResponses,
    });
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`--- Server running on port ${PORT} ---`);
});
