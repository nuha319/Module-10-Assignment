const form = document.getElementById("aiForm");

const input = document.getElementById("promptInput");

const button = document.getElementById("generateButton");

const errorMessage = document.getElementById("errorMessage");

const result = document.getElementById("result");


form.addEventListener("submit", async (event) => {

  event.preventDefault();

  const prompt = input.value.trim();

  errorMessage.textContent = "";



  if (!prompt) {

    errorMessage.textContent =
      "Please enter a prompt.";

    input.focus();

    return;

  }



  button.disabled = true;

  button.textContent = "Generating...";

  result.textContent =
    "Please wait while the AI generates a response.";


  try {

    const response = await fetch(
      "/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          prompt: prompt
        })
      }
    );


    const data = await response.json();


    if (!response.ok) {

      throw new Error(
        data.error || "Something went wrong."
      );

    }



    result.textContent = data.result;


  } catch (error) {

    errorMessage.textContent = error.message;

    result.textContent =
      "No response generated.";


  } finally {

    button.disabled = false;

    button.textContent =
      "Generate Response";

  }

});