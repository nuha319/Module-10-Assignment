require("dotenv").config();

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5000;

const geminiClient = import("@google/genai");

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
};

function serveFile(filePath, response) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, {
        "Content-Type": "text/plain",
      });

      response.end("404 - File Not Found");
      return;
    }

    const extension = path.extname(filePath);

    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "text/plain",
    });

    response.end(content);
  });
}

function readRequestBody(request, callback) {
  let body = "";

  request.on("data", (chunk) => {
    body += chunk;
  });

  request.on("end", () => {
    try {
      const data = JSON.parse(body);
      callback(null, data);
    } catch (error) {
      callback(error, null);
    }
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/generate") {
    readRequestBody(request, async (error, data) => {
      if (error) {
        response.writeHead(400, {
          "Content-Type": "application/json",
        });

        response.end(
          JSON.stringify({
            error: "Invalid request.",
          }),
        );

        return;
      }

      const prompt = data.prompt?.trim();

      if (!prompt) {
        response.writeHead(400, {
          "Content-Type": "application/json",
        });

        response.end(
          JSON.stringify({
            error: "Please enter a prompt.",
          }),
        );

        return;
      }

      try {
        const { GoogleGenAI } = await geminiClient;

        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });

        const result = aiResponse.text;

        response.writeHead(200, {
          "Content-Type": "application/json",
        });

        response.end(
          JSON.stringify({
            result: result,
          }),
        );
      } catch (error) {
        console.error("Gemini API Error:", error.message);

        response.writeHead(500, {
          "Content-Type": "application/json",
        });

        response.end(
          JSON.stringify({
            error: "Unable to generate a response. Check your Gemini API key.",
          }),
        );
      }
    });

    return;
  }

  if (request.method === "GET") {
    let requestedPath = request.url === "/" ? "/index.html" : request.url;

    requestedPath = requestedPath.split("?")[0];

    const filePath = path.join(__dirname, "public", requestedPath);

    serveFile(filePath, response);

    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain",
  });

  response.end("404 - Page Not Found");
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
