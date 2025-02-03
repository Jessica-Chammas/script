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
        product_id: `prod_${productId}`,
        store_url: storeURL,
        language: language,
    }).toString();

    const url = `${apiUrl}?${queryParams}`;
    console.log("API Request URL:", url); // Log the constructed URL for debugging purposes.

    try {
        // Perform a GET request to the Lambda function.
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Rever-Final-Url": "https://api.byrever.com/v1/public/analytics/get_product_size_suggestion",
            },
            mode: "cors",
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
        console.error("Fetch Error:", error);
        return null;
    }
}

// Extracts the store URL dynamically from the current hostname.
function extractStoreUrl() {
    const hostname = window.location.hostname;
    const match = hostname.match(/^(.*?)\.com/);
    const storeUrl = match ? match[0] : null;
    console.log("Store URL:", storeUrl);
    return storeUrl;
}

// Detects the preferred language of the user.
function detectLanguage() {
    const lang = document.documentElement.lang || navigator.language;
    const baseLang = lang.split("-")[0];
    console.log("Detected Language:", baseLang);
    return baseLang;
}

// Main process to fetch and display size recommendations for the current product.
async function processUrl() {
    // Extract the product ID using various fallback methods.
    const productId = extractProductId();
    if (!productId) {
        console.error("Error: Product ID could not be determined.");
        return;
    }

    // Fetch the size recommendation for the product.
    const recommendation = await fetchSizeRecommendationFromLambda(productId);

    // Locate the container element for displaying the recommendation.
    const container = document.getElementById("size-recommendation-container");
    if (!container) {
        console.error("Error: Recommendation container not found.");
        return;
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
            <div class="recommendation-message" style="margin-top: 10px; display: flex; align-items: center;">
                <!-- REVER logo completely aligned to the left, larger size -->
                <div style="width: 50px; height: 50px; margin-right: 10px; flex-shrink: 0;">
                    <img src="https://media.licdn.com/dms/image/v2/D4D0BAQGrGdArwEeEiw/company-logo_200_200/company-logo_200_200/0/1710869413593/itsrever_logo?e=2147483647&v=beta&t=xn2DNOVVAhe5KoH72zzkBrvrqCMyTIXlt_zP8BH9OHE" 
                         alt="ItsRever Logo" style="height: 40px; width: 40px; border-radius: 50%; vertical-align: middle;">
                </div>

                <!-- Text recommendation -->
                <div style="flex-grow: 1; display: flex; flex-direction: column;">
                    <div class="banner-prefix" style="font-weight: bold; color: black;">
                        ${bannerPrefix}
                        <a href="https://www.itsrever.com/#" target="_blank" style="text-decoration: none;">
                            <img src="https://rever-static-files.s3.eu-west-3.amazonaws.com/logos/Rever-Logotype-Positive.svg" 
                                 alt="REVER Logo" style="height: 20px; margin-right: 2px;">
                            <span style="color: black; font-weight: normal;"><strong>suggests</strong>:</span>
                        </a>
                    </div>

                    <!-- Grey background box for the suggestion message -->
                    <div style="background-color: #f0f0f0; padding: 5px 8px; border-radius: 8px; margin-top: 5px; max-width: 95%;">
                        <p style="font-size: 0.9em; color: #000; margin: 0;">${suggestionMessage}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        console.warn("No size recommendation available for this product.");
    }
}

// Retrieves language-specific messages for size recommendations.
// Parameters:
// - language: The detected language code (e.g., 'en', 'es').
// - suggestion: The size suggestion type ('smaller' or 'larger').
// Returns an object with the bannerPrefix and suggestionMessage.
function getLanguageSpecificMessages(language, suggestion) {
    const messages = {
        en: {
            bannerPrefix: "Based on previous orders,",
            tooSmall: "This item sizes smaller than usual. When in doubt, we recommend choosing a <strong>larger size</strong>.",
            tooBig: "This item sizes larger than usual. When in doubt, we recommend choosing a <strong>smaller size</strong>.",
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

    const langMessages = messages[language] || messages.en;
    const suggestionMessage =
        suggestion === "smaller"
            ? langMessages.tooSmall
            : suggestion === "bigger"
            ? langMessages.tooBig
            : null;

    return { bannerPrefix: langMessages.bannerPrefix, suggestionMessage };
}

// Extracts the product ID using fallback methods.
function extractProductId() {
    const productId = extractProductIdFromUrl(window.location.href)
        || extractProductIdFromHtml()
        || extractProductIdFromMetaTag();

    if (productId) {
        console.log("Extracted Product ID:", productId);
        return productId;
    }

    console.error("Error: Product ID could not be extracted.");
    return null;
}

// Extracts the product ID from the URL.
function extractProductIdFromUrl(url) {
    const regex = /\/(?:product\/|)(\d+)[-\/]/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Extracts the product ID from hidden input fields in HTML.
function extractProductIdFromHtml() {
    const selectors = [
        'input[name="id_product"]',
        'input[id="product_page_product_id"]',
        '[data-product-id]',
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element.value || element.dataset.productId;
    }
    
    return null;
}

// Extracts the product ID from meta tags.
function extractProductIdFromMetaTag() {
    const meta = document.querySelector('meta[name="product-id"], meta[property="og:product:id"]');
    return meta ? meta.content : null;
}

// Run the main process to fetch and display size recommendations.
processUrl();
