import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  Input,
  Textarea,
  Button,
  Card,
  CardContent,
  Badge,
} from "@/components/shared";
import { TemplateDetailsForm } from "./zod-schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { templateDetailsSchema } from "./zod-schema";
import React from "react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/shared/file-upload/file-upload";
import { CloudUpload, X, ArrowRight, ImageIcon, AlertCircle } from "lucide-react";

export function TemplateDetailsTab({
  value,
  onChange,
  onNext,
}: {
  value: TemplateDetailsForm;
  onChange: (data: TemplateDetailsForm) => void;
  onNext: () => void;
}) {

  const form = useForm<TemplateDetailsForm>({
    resolver: zodResolver(templateDetailsSchema),
    defaultValues: value,
    values: value,
  });

  React.useEffect(() => {
    form.reset(value);
  }, [value]);

  async function handleNext() {
    const valid = await form.trigger();
    if (valid) {
      onChange(form.getValues());
      onNext();
    }
  }

  const handleFieldChange = React.useCallback(() => {
    onChange(form.getValues());
  }, [form, onChange]);

  return (
    <Form {...form}>
      <div className="space-y-8 bg-background text-foreground min-h-screen p-4 md:p-0">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Template Details</h2>
          <p className="text-muted-foreground">
            Provide basic information about your template to help users understand its purpose.
          </p>
        </div>
        
        <form
          className="space-y-8"
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
        >
          <Card className="shadow-sm overflow-hidden border-0 ring-1 ring-gray-200 dark:ring-gray-800">
            <CardContent className="p-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Form Fields Section */}
                <div className="space-y-6">
                  <div className="mb-2">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Enter the core details of your template
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Template Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter template name"
                            className="h-11 text-base border-gray-200 dark:border-gray-800 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black"
                            onBlur={() => { field.onBlur(); handleFieldChange(); }}
                            onChange={e => { field.onChange(e); handleFieldChange(); }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">A clear, descriptive name for your template</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe what this template is for..."
                            className="min-h-24 resize-y text-base border-gray-200 dark:border-gray-800 rounded-md shadow-sm focus:ring-2 focus:ring-black focus:border-black"
                            onBlur={() => { field.onBlur(); handleFieldChange(); }}
                            onChange={e => { field.onChange(e); handleFieldChange(); }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Explain the purpose and benefits of this template</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-medium">Template Image</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Add a visual representation
                      </p>
                    </div>
                    {form.getValues("image") && (
                      <Badge variant="outline" className="font-normal py-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                        Image Added
                      </Badge>
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FileUpload
                            value={field.value ? [field.value] : []}
                            onValueChange={files => {
                              field.onChange(files[0]);
                              handleFieldChange();
                            }}
                            accept="image/*"
                            maxFiles={1}
                            maxSize={5 * 1024 * 1024}
                            onFileReject={(_, message) => {
                              form.setError("image", { message });
                            }}
                          >
                            {!field.value ? (
                              <FileUploadDropzone className="flex-col border-2 border-dashed h-[220px] flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                <CloudUpload className="w-10 h-10 mb-3 text-gray-400" />
                                <p className="mb-2 text-base font-medium">
                                  Drag and drop an image
                                </p>
                                <FileUploadTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mb-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                                  >
                                    Browse files
                                  </Button>
                                </FileUploadTrigger>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PNG, JPG or GIF (max. 5MB)
                                </p>
                              </FileUploadDropzone>
                            ) : (
                              <FileUploadList>
                                <FileUploadItem value={field.value}>
                                  <div className="relative h-[220px] w-full overflow-hidden rounded-lg shadow-inner">
                                    <FileUploadItemPreview className="h-full w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-4 right-0">
                                      {/* Showing file metadata only, not the name separately */}
                                      <FileUploadItemMetadata className="text-white/70 text-xs" />
                                    </div>
                                    <FileUploadItemDelete asChild className="absolute top-2 right-2">
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full shadow-md bg-white/90 hover:bg-white text-red-600 hover:text-red-700 border-0"
                                        onClick={() => {
                                          field.onChange(undefined);
                                          handleFieldChange();
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                      </Button>
                                    </FileUploadItemDelete>
                                  </div>
                                </FileUploadItem>
                              </FileUploadList>
                            )}
                          </FileUpload>
                        </FormControl>
                        {form.formState.errors.image && (
                          <div className="mt-2 flex items-center gap-1.5 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4" />
                            <FormMessage />
                          </div>
                        )}
                        <FormDescription className="text-xs mt-2">
                          Add an image to visually represent your template
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
              id="template-details-next" 
              type="submit"
              className="px-8 font-medium bg-black text-white hover:bg-gray-900 shadow-sm"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}
