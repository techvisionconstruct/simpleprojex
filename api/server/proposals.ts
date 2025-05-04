import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN = Cookies.get("auth-token");

export async function postProposal(proposal: any) {
  // Format proposal data to match backend expectations
  const formattedProposal = {
    ...proposal,
    template_elements: proposal.template_elements.map((element: any) => ({
      ...element,
      // Ensure these are integers for backend validation
      material_cost: Math.round(Number(element.material_cost)),
      labor_cost: Math.round(Number(element.labor_cost)),
      markup: Math.round(Number(element.markup))
    }))
  };
  
  console.log("Sending proposal to API:", JSON.stringify(formattedProposal, null, 2));
  try {
    const response = await fetch(`${API_URL}/api/projects/project/new/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(formattedProposal),
    });

    if (!response.ok) {
      let errorMessage = "Failed to create proposal";
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Format validation errors from array
              const errMessages = errorData.detail.map((err: any) => {
                // Handle nested error objects or simple strings
                const message = typeof err === 'object' ? 
                  `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg || JSON.stringify(err)}` : 
                  err;
                return message;
              });
              
              errorMessage = errMessages.join(', ');
              console.error("Validation errors:", errMessages);
            } else {
              errorMessage = errorData.detail.toString();
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
          
          console.error("API Error Response:", errorData);
        } else {
          // Handle non-JSON responses
          const errorText = await response.text();
          console.error("API Error Response (raw):", errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error response:", e);
      }
      
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating proposal:", error);
    throw error;
  }
}
