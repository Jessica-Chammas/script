document.addEventListener("DOMContentLoaded", function() {
  const container = document.getElementById("size-recommendation-container");
  
  if (!container) {
    console.error("Recommendation container not found.");
    return;
  }

  const productId = container?.getAttribute("data-product-id");

  if (!productId) {
    console.error("Product ID not found.");
    return;
  }

  // Set store URL with a fallback for localhost or production
  let storeURL = window.location.hostname;
  if (window.location.hostname === "localhost") {
    storeURL = "prestashop.byrever.com"; // Change this to your actual production domain
  }

  console.log("Store URL:", storeURL);

  const language = navigator.language.split("-")[0];
  const queryParams = "product_id=prod_" + productId +
                      "&store_url=" + encodeURIComponent(storeURL) +
                      "&language=" + encodeURIComponent(language);

  const apiUrl = "https://3o3sepchz3wyufedqsjmeben6e0yemfo.lambda-url.eu-west-3.on.aws/";
  const url = apiUrl + "?" + queryParams;

  console.log("API Request URL:", url);

  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Rever-Final-Url": "https://api.byrever.com/v1/public/analytics/get_product_size_suggestion",
    },
  })
    .then(response => {
      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        return null;
      }
      return response.json();
    })
    .then(result => {
      console.log("API Response:", result);

      const recommendation = result && result.suggestion_copy ? result.suggestion_copy : "No recommendation available.";
      container.innerHTML = "<div class='recommendation-message' style='margin-top: 10px; display: flex; align-items: center;'>"
        + "<div style='width: 50px; height: 50px; margin-right: 10px; flex-shrink: 0;'>"
        + "<img src='https://media.licdn.com/dms/image/v2/D4D0BAQGrGdArwEeEiw/company-logo_200_200/company-logo_200_200/0/1710869413593/itsrever_logo?e=2147483647&v=beta&t=xn2DNOVVAhe5KoH72zzkBrvrqCMyTIXlt_zP8BH9OHE' alt='ItsRever Logo' style='height: 40px; width: 40px; border-radius: 50%; vertical-align: middle;'>"
        + "</div><div style='flex-grow: 1; display: flex; flex-direction: column;'>"
        + "<div class='banner-prefix' style='font-weight: bold; color: black;'>Based on previous orders, "
        + "<a href='https://www.itsrever.com/#' target='_blank' style='text-decoration: none;'>"
        + "<img src='https://rever-static-files.s3.eu-west-3.amazonaws.com/logos/Rever-Logotype-Positive.svg' alt='REVER Logo' style='height: 20px; margin-right: 2px;'>"
        + "<span style='color: black; font-weight: normal;'><strong>suggests</strong>:</span></a></div>"
        + "<div style='background-color: #f0f0f0; padding: 5px 8px; border-radius: 8px; margin-top: 5px; max-width: 95%;'>"
        + "<p style='font-size: 0.9em; color: #000; margin: 0;'>" + recommendation + "</p>"
        + "</div></div></div>";
    })
    .catch(error => {
      console.error("Fetch Error:", error);
    });
});
