async function fetchSizeRecommendationFromLambda(productId) {
  const apiUrl = "https://3o3sepchz3wyufedqsjmeben6e0yemfo.lambda-url.eu-west-3.on.aws/";
  const storeURL = "prestashop.byrever.com";

  // Set language dynamically
  const language = detectLanguage();

  const queryParams = new URLSearchParams({
    product_id: `prod_${productId}`,
    store_url: storeURL,
    language: language,
  }).toString();

  const url = `${apiUrl}?${queryParams}`;
  console.log("Constructed URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Rever-Final-Url": "https://api.byrever.com/v1/public/analytics/get_product_size_suggestion",
      },
      mode: "cors",
    });

    if (!response.ok) {
      console.error("Error response from Lambda:", response.statusText);
      return null;
    }

    const result = await response.json();
    console.log("Parsed JSON response:", result);
    return result;
  } catch (error) {
    console.error("Error calling Lambda:", error);
    return null;
  }
}

function detectLanguage() {
  // Detect language from <html> or use browser default
  const htmlLang = document.documentElement.lang || navigator.language;
  console.log("Detected language:", htmlLang);
  return htmlLang.split("-")[0]; // Extract base language (e.g., 'en' from 'en-US')
}

async function processUrl() {
  const productId = extractProductId();

  if (!productId) {
    console.error("Product ID not found using available methods.");
    return;
  }

  const language = detectLanguage();
  const recommendation = await fetchSizeRecommendationFromLambda(productId);

  const container = document.getElementById("size-recommendation-container");
  if (container) {
    if (recommendation && recommendation.suggestion) {
      // Normalize the suggestion to lowercase
      const normalizedSuggestion = recommendation.suggestion.toLowerCase();
      const { bannerPrefix, suggestionMessage } = getLanguageSpecificMessages(language, normalizedSuggestion);

      // Create the recommendation container
      const recommendationContainer = document.createElement("div");
      recommendationContainer.style.marginTop = "20px";
      recommendationContainer.style.fontSize = "0.9em";
      recommendationContainer.style.color = "#888";
      recommendationContainer.style.display = "flex";
      recommendationContainer.style.alignItems = "center";

      // Add the prefix and logo
      const bannerPrefixContainer = document.createElement("div");
      bannerPrefixContainer.textContent = bannerPrefix;
      bannerPrefixContainer.style.marginRight = "8px";

      const logoContainer = document.createElement("a");
      logoContainer.href = "https://www.itsrever.com/#";
      logoContainer.target = "_blank";

      const logoImage = document.createElement("img");
      logoImage.src = "https://rever-static-files.s3.eu-west-3.amazonaws.com/logos/Rever-Logotype-Positive.svg";
      logoImage.alt = "REVER Logo";
      logoImage.style.height = "20px";
      logoImage.style.marginRight = "5px";

      logoContainer.appendChild(logoImage);
      bannerPrefixContainer.appendChild(logoContainer);

      // Add the suggestion message
      const messageContainer = document.createElement("div");
      messageContainer.innerHTML = suggestionMessage;
      messageContainer.style.marginLeft = "8px";

      recommendationContainer.appendChild(bannerPrefixContainer);
      recommendationContainer.appendChild(messageContainer);

      container.innerHTML = ""; // Clear any previous content
      container.appendChild(recommendationContainer);
    } else {
      container.innerHTML = "No size recommendation available for this product.";
    }
  } else {
    console.error("Container element not found.");
  }
}

function getLanguageSpecificMessages(language, suggestion) {
  const messages = {
    en: {
      bannerPrefix: "Based on previous orders,",
      tooSmall: "This item sizes smaller than usual. When in doubt, choose a <strong>larger size</strong>.",
      tooBig: "This item sizes larger than usual. When in doubt, choose a <strong>smaller size</strong>.",
      trueToSize: "This item runs true to size based on similar orders.",
    },
    es: {
      bannerPrefix: "Basado en pedidos anteriores,",
      tooSmall: "Este artículo talla más pequeño de lo habitual. En caso de duda, elija una <strong>talla más grande</strong>.",
      tooBig: "Este artículo talla más grande de lo habitual. En caso de duda, elija una <strong>talla más pequeña</strong>.",
      trueToSize: "Este artículo tiene un tamaño fiel al habitual según pedidos similares.",
    },
    fr: {
      bannerPrefix: "Basé sur des commandes précédentes,",
      tooSmall: "Cet article taille plus petit que d'habitude. En cas de doute, choisissez une <strong>taille supérieure</strong>.",
      tooBig: "Cet article taille plus grand que d'habitude. En cas de doute, choisissez une <strong>taille inférieure</strong>.",
      trueToSize: "Cet article taille comme prévu selon les commandes similaires.",
    },
    // Add additional languages here...
  };

  const langMessages = messages[language] || messages["en"]; // Default to English if language not found
  const suggestionMessage =
    suggestion === "smaller"
      ? langMessages.tooSmall
      : suggestion === "larger"
      ? langMessages.tooBig
      : langMessages.trueToSize;

  return {
    bannerPrefix: langMessages.bannerPrefix,
    suggestionMessage,
  };
}

// Function to extract the product ID using various methods
function extractProductId() {
  console.log("Extracting Product ID...");

  const productIdFromUrl = extractProductIdFromUrl(window.location.href);
  if (productIdFromUrl) {
    console.log("Product ID extracted from URL:", productIdFromUrl);
    return productIdFromUrl;
  }

  const productIdFromHtml = extractProductIdFromHtml();
  if (productIdFromHtml) {
    console.log("Product ID extracted from HTML:", productIdFromHtml);
    return productIdFromHtml;
  }

  const productIdFromMeta = extractProductIdFromMetaTag();
  if (productIdFromMeta) {
    console.log("Product ID extracted from Meta Tag:", productIdFromMeta);
    return productIdFromMeta;
  }

  console.error("Failed to extract Product ID.");
  return null;
}

// Function to extract the product ID from the URL
function extractProductIdFromUrl(url) {
  const regex = /\/(\d+)-/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to extract the product ID from the HTML DOM
function extractProductIdFromHtml() {
  console.log("Extracting Product ID from HTML DOM...");
  const hiddenInput = document.querySelector('input[name="id_product"], input[id="product_page_product_id"]');
  return hiddenInput ? hiddenInput.value : null;
}

// Function to extract the product ID from meta tags
function extractProductIdFromMetaTag() {
  console.log("Extracting Product ID from Meta Tags...");
  const metaTag = document.querySelector('meta[name="product-id"], meta[property="og:product:id"]');
  return metaTag ? metaTag.content : null;
}

// Run the script
processUrl();
