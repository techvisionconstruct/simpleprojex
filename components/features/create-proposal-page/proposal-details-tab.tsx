import React from "react";
import {
  Input,
  Textarea,
  Button,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@/components/shared";
import { 
  CloudUpload, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";

interface ProposalDetailsTabProps {
  value: {
    name: string;
    description: string;
    client_name: string;
    client_email: string;
    phone_number: string;
    address: string;
    image: string;
  };
  onChange: (value: any) => void;
  onNext: () => void;
  onBack?: () => void;
  errors?: Record<string, string>;
}

export function ProposalDetailsTab({ 
  value, 
  onChange, 
  onNext,
  onBack,
  errors = {} 
}: ProposalDetailsTabProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: inputValue } = e.target;
    onChange({
      ...value,
      [name]: inputValue,
    });
  };
  
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = e.target;
    // Allow only numbers and common phone number special characters
    const formattedValue = inputValue.replace(/[^\d\s\-\+\(\)\.]/g, '');
    onChange({
      ...value,
      phone_number: formattedValue,
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Proposal Details</h2>
        <p className="text-sm text-muted-foreground">
          Provide information about your proposal and client
        </p>
      </div>

      {hasErrors && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Please fix the highlighted errors before continuing</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Proposal Information */}
        <Card className={errors["name"] || errors["description"] ? "border-red-200 ring-1 ring-red-200" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Proposal Information
            </CardTitle>
            <CardDescription>
              Essential details about the proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Proposal Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter a descriptive name for this proposal"
                value={value.name}
                onChange={handleInputChange}
                className={errors["name"] ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors["name"] && (
                <p className="text-sm text-red-500">{errors["name"]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A clear name helps identify this proposal later
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the scope and purpose of this proposal"
                value={value.description}
                onChange={handleInputChange}
                className={`min-h-32 ${errors["description"] ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {errors["description"] && (
                <p className="text-sm text-red-500">{errors["description"]}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Provide a detailed overview of the project and its goals
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Proposal Image
              </Label>
              <div>
                {!value.image ? (
                  <div className="border-2 border-dashed h-48 flex flex-col items-center justify-center bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                    <CloudUpload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Upload a cover image
                    </p>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            // Show error if file is larger than 5MB
                            alert("File is too large. Please select an image less than 5MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            onChange({
                              ...value,
                              image: event.target?.result as string || "",
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mb-1"
                      onClick={() => {
                        document.getElementById("image-upload")?.click();
                      }}
                    >
                      Browse files...
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or GIF (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative mb-1">
                    <div className="relative h-48 w-full overflow-hidden rounded-lg border">
                      <img
                        src={value.image}
                        alt="Proposal"
                        className="h-full w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md absolute top-2 right-2"
                        onClick={() => {
                          onChange({
                            ...value,
                            image: "",
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  </div>
                )}
                {errors["image"] && (
                  <p className="text-sm text-red-500 mt-1">{errors["image"]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Adding a relevant image helps make your proposal visually appealing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card className={errors["client_name"] || errors["client_email"] || errors["phone_number"] || errors["address"] ? "border-red-200 ring-1 ring-red-200" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              Client Information
            </CardTitle>
            <CardDescription>
              Details about the client for this proposal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name" className="text-sm font-medium">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="client_name"
                  name="client_name"
                  placeholder="Enter client's full name"
                  value={value.client_name}
                  onChange={handleInputChange}
                  className={`pl-10 ${errors["client_name"] ? "border-red-500 focus:ring-red-500" : ""}`}
                />
              </div>
              {errors["client_name"] && (
                <p className="text-sm text-red-500">{errors["client_name"]}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_email" className="text-sm font-medium">
                Client Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="client_email"
                  name="client_email"
                  type="email"
                  placeholder="client@example.com"
                  value={value.client_email}
                  onChange={handleInputChange}
                  className={`pl-10 ${errors["client_email"] ? "border-red-500 focus:ring-red-500" : ""}`}
                />
              </div>
              {errors["client_email"] && (
                <p className="text-sm text-red-500">{errors["client_email"]}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone_number"
                  name="phone_number"
                  placeholder="(123) 456-7890"
                  value={value.phone_number}
                  onChange={handlePhoneInput}
                  className={`pl-10 ${errors["phone_number"] ? "border-red-500 focus:ring-red-500" : ""}`}
                />
              </div>
              {errors["phone_number"] && (
                <p className="text-sm text-red-500">{errors["phone_number"]}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Client Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Enter client's full address"
                  value={value.address}
                  onChange={handleInputChange}
                  className={`pl-10 ${errors["address"] ? "border-red-500 focus:ring-red-500" : ""}`}
                />
              </div>
              {errors["address"] && (
                <p className="text-sm text-red-500">{errors["address"]}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className="px-6 font-medium order-2 sm:order-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        )}
        <Button 
          onClick={onNext}
          size="lg" 
          className="px-8 font-medium order-1 sm:order-2 ml-auto"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
