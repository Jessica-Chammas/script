// Fetches size recommendations for a product from an AWS Lambda function.
// Parameters:
// - productId: The ID of the product for which the size recommendation is requested.
async function fetchSizeRecommendationFromLambda(productId) {
    const apiUrl = "https://3o3sepchz3wyufedqsjmeben6e0yemfo.lambda-url.eu-west-3.on.aws/";

    // Extract the store's URL dynamically from the browser's location.
    const storeURL = extractStoreUrl();
    if (!storeURL) {
        console.error("Error: Unable to extract the store URL. Ensure the hostname is correct.");
        return null; // Exit if the store URL cannot be determined.
    }

    // Detect the user's language from the browser or page settings.
    const language = detectLanguage();

    // Construct the query parameters for the API request.
    const queryParams = new URLSearchParams({
        product_id: productId, 
        store_url: storeURL, // Use the extracted store URL.
        language: language, // Add the detected language.
    }).toString();

    const url = `${apiUrl}?${queryParams}`;
    console.log("API Request URL:", url); // Log the constructed URL for debugging purposes.

    try {
        // Perform a GET request to the Lambda function.
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // Specify JSON content type.
                "X-Rever-Final-Url": "https://api.byrever.com/v1/public/analytics/get_product_size_suggestion", // Additional header for API tracking.
            },
            mode: "cors", // Enable Cross-Origin Resource Sharing.
        });

        // Check for a successful response. Log and return null if the response is not OK.
        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            return null;
        }

        // Parse the response JSON and return it.
        const result = await response.json();
        console.log("API Response:", result);
        return result;
    } catch (error) {
        // Handle errors during the fetch process.
        console.error("Fetch Error:", error);
        return null;
    }
}

// Extracts the store URL dynamically from the current hostname.
function extractStoreUrl() {
    const hostname = window.location.hostname; // E.g., "localhost" or "prestashop.byrever.com"
    
    // Handle the case for localhost or 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'localhost'; // You can return 'localhost' or any other unique identifier for local testing
    }
    
    // For other domains, extract the store URL before ".com"
    const match = hostname.match(/^(.*?)\.com/);
    const storeUrl = match ? match[0] : null; // Return the matched portion or null.
    console.log("Store URL:", storeUrl); // Log the extracted store URL for debugging.
    return storeUrl;
}

// Detects the preferred language of the user.
function detectLanguage() {
    const lang = document.documentElement.lang || navigator.language; // Use <html lang> or browser language.
    const baseLang = lang.split("-")[0]; // Extract the base language code.
    console.log("Detected Language:", baseLang); // Log the detected language.
    return baseLang;
}

// Main process to fetch and display size recommendations for the current product.
async function processUrl() {
    // Extract the product ID using various fallback methods.
    const productId = extractProductId();
    if (!productId) {
        console.error("Error: Product ID could not be determined.");
        return; // Exit if no product ID is found.
    }

    // Fetch the size recommendation for the product.
    const recommendation = await fetchSizeRecommendationFromLambda(productId);

    // Locate the container element for displaying the recommendation.
    const container = document.getElementById("size-recommendation-container");
    if (!container) {
        console.error("Error: Recommendation container not found.");
        return; // Exit if the container element is not found.
    }

    if (recommendation && recommendation.suggestion) {
        // Retrieve language-specific messages based on the recommendation.
        const { bannerPrefix, suggestionMessage } = getLanguageSpecificMessages(
            detectLanguage(),
            recommendation.suggestion.toLowerCase()
        );

        // Exit if the suggestion message is invalid or missing.
        if (!suggestionMessage) {
            console.warn("Warning: No valid suggestion available.");
            return;
        }

        // Update the container with the recommendation message.
        container.innerHTML = `
            <div class="recommendation-message" style="margin-top: 20px;">
                <div class="banner-prefix">
                    ${bannerPrefix}
                    <a href="https://www.itsrever.com/#" target="_blank" style="text-decoration: none;">
                        <img src="https://rever-static-files.s3.eu-west-3.amazonaws.com/logos/Rever-Logotype-Positive.svg" 
                            alt="REVER Logo" style="height: 20px; margin-right: 5px;">
                        <span style="color: black; font-weight: normal;">suggests:</span>
                    </a>
                </div>
                <span style="font-size: 0.9em; color: #888;">${suggestionMessage}</span>
            </div>
        `;
    } else {
        console.warn("No size recommendation available for this product.");
    }
}

// Retrieves language-specific messages for size recommendations.
function getLanguageSpecificMessages(language, suggestion) {
    const messages = {
        en: {
            bannerPrefix: "Based on previous orders,",
            tooSmall: "This item sizes smaller than usual. When in doubt, choose a <strong>larger size</strong>.",
            tooBig: "This item sizes larger than usual. When in doubt, choose a <strong>smaller size</strong>.",
        },
        es: {
            bannerPrefix: "Basado en pedidos anteriores,",
            tooSmall: "Este artículo talla más pequeño de lo habitual. En caso de duda, elija una <strong>talla más grande</strong>.",
            tooBig: "Este artículo talla más grande de lo habitual. En caso de duda, elija una <strong>talla más pequeña</strong>.",
        },
        fr: {
            bannerPrefix: "Basé sur des commandes précédentes,",
            tooSmall: "Cet article taille plus petit que d'habitude. En cas de doute, choisissez une <strong>taille supérieure</strong>.",
            tooBig: "Cet article taille plus grand que d'habitude. En cas de doute, choisissez une <strong>taille inférieure</strong>.",
        },
    };

    const langMessages = messages[language] || messages.en; // Default to English.
    const suggestionMessage =
        suggestion === "smaller"
            ? langMessages.tooSmall
            : suggestion === "bigger"
            ? langMessages.tooBig
            : null; // Null if no valid suggestion.

    return { bannerPrefix: langMessages.bannerPrefix, suggestionMessage };
}

// Extracts the product ID from the URL.
function extractProductIdFromUrl(url) {
    const regex = /[?&]id_product=(\d+)/; // Matches "id_product=2"
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Run the main process to fetch and display the size recommendations.
processUrl();
