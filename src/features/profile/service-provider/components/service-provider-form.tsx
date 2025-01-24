"use client";

import Image from "next/image";
import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { BillingType, Languages } from "@prisma/client";
import { useFormState } from "react-dom";
import { useForm, useWatch } from "react-hook-form";

import { registerServiceProvider } from "../lib/actions";
import {
  type ServiceProviderFormType,
  serviceProviderSchema,
} from "../lib/schema";

const ACCEPTED_IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".webp"];

type Props = {
  serviceProviderTypes: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    name: string;
    serviceProviderTypeId: string;
    description?: string;
    displayPriority: number;
  }>;
  requirementTypes: Array<{
    id: string;
    name: string;
    description?: string | null;
    validationType: string;
    isRequired: boolean;
    serviceProviderTypeId: string;
    validationConfig?: any;
    displayPriority?: number;
  }>;
  languages: Array<{
    id: Languages;
    name: Languages;
  }>;
  billingTypes: Array<{
    id: BillingType;
    name: BillingType;
  }>;
  userId: string;
};

function ServiceProviderForm({
  serviceProviderTypes,
  services,
  requirementTypes,
  languages,
  billingTypes,
  userId,
}: Props): JSX.Element {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [state, formAction] = useFormState(registerServiceProvider, null);
  const form = useForm<ServiceProviderFormType>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      serviceProviderTypeId: "",
      name: "",
      bio: "",
      image: null,
      languages: [],
      billingType: undefined,
      website: "",
      services: [],
      requirements: [],
      termsAccepted: undefined,
    },
  });

  // Handle image preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const selectedProviderType = useWatch({
    control: form.control,
    name: "serviceProviderTypeId",
  });

  const filteredServices = services.filter((service) =>
    selectedProviderType
      ? service.serviceProviderTypeId === selectedProviderType
      : false,
  );

  const filteredRequirements = requirementTypes.filter((requirement) =>
    selectedProviderType
      ? requirement.serviceProviderTypeId === selectedProviderType
      : false,
  );

  const onSubmit = (data: ServiceProviderFormType) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === "object" && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value ?? ""));
      }
    });

    formAction(formData);
  };

  return (
    <form action={formAction} onSubmit={form.handleSubmit(onSubmit)}>
      {/* Service Provider Details */}
      <section className="mb-8 space-y-4 rounded-lg p-4">
        <h3 className="mb-8 text-xl font-semibold">Service Provider Details</h3>

        <input type="hidden" {...form.register("userId")} value={userId} />

        {/* Service Provider Type */}
        <div className="space-y-2">
          <label
            htmlFor="provider-type-label"
            className="block text-sm font-medium"
          >
            Provider Type
            <select
              id="provider-type-label"
              {...form.register("serviceProviderTypeId")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a provider type...</option>
              {serviceProviderTypes
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
            </select>
            {form.formState.errors.serviceProviderTypeId && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.serviceProviderTypeId.message}
              </p>
            )}
          </label>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
            <input
              type="text"
              id="name"
              {...form.register("name")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {form.formState.errors.name && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </label>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio
            <textarea
              id="bio"
              {...form.register("bio")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
            />
            {form.formState.errors.bio && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.bio.message}
              </p>
            )}
          </label>
        </div>

        {/* Image Upload with Preview */}
        <div className="space-y-4">
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700"
          >
            Profile Image
            <input
              type="file"
              id="image"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              {...form.register("image", {
                onChange: (e) => {
                  console.log("File selected:", e.target.files);
                  handleImageChange(e);
                },
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          {form.formState.errors.image && (
            <p className="text-sm text-red-500">
              {form.formState.errors.image.message?.toString()}
            </p>
          )}
          {imagePreview && (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              <Image
                src={imagePreview}
                alt="Profile preview"
                fill
                className="object-cover"
              />
            </div>
          )}
          <p className="text-sm text-gray-500">
            Max file size: 5MB. Supported formats: JPG, PNG, WebP
          </p>
        </div>

        {/* Languages */}
        <div className="space-y-2">
          <label
            htmlFor="languages"
            className="block text-sm font-medium text-gray-700"
          >
            Languages Spoken
            <select
              id="languages"
              multiple
              {...form.register("languages")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            {form.formState.errors.languages && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.languages.message}
              </p>
            )}
          </label>
          <p className="text-sm text-gray-500">
            Hold Ctrl/Cmd to select multiple languages
          </p>
        </div>

        {/* Billing Type */}
        <div className="space-y-2">
          <label
            htmlFor="billingType"
            className="block text-sm font-medium text-gray-700"
          >
            Billing Type
            <select
              id="billingType"
              {...form.register("billingType")}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select billing type...</option>
              {billingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {form.formState.errors.billingType && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.billingType.message}
              </p>
            )}
          </label>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
            <input
              type="url"
              id="website"
              {...form.register("website")}
              placeholder="https://example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {form.formState.errors.website && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.website.message}
              </p>
            )}
          </label>
        </div>
      </section>

      {/* Only show Services and Requirements if provider type is selected */}
      {selectedProviderType && (
        <>
          {/* Services */}
          <section className="mb-8 space-y-4 rounded-lg p-4">
            <h3 className="mb-8 text-xl font-semibold">Services</h3>
            <div className="space-y-2">
              {filteredServices
                .sort((a, b) => a.displayPriority - b.displayPriority)
                .map((service) => (
                  <label
                    key={service.id}
                    htmlFor={`service-${service.id}`}
                    className="flex items-center space-x-3"
                  >
                    <input
                      type="checkbox"
                      id={`service-${service.id}`}
                      value={service.id}
                      {...form.register("services")}
                      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        form.formState.errors.services ? "border-red-500" : ""
                      }`}
                    />
                    <span className="text-sm text-gray-700">
                      {service.name}
                    </span>
                  </label>
                ))}
              {form.formState.errors.services && (
                <p className="mt-2 text-sm text-red-500">
                  {form.formState.errors.services.message}
                </p>
              )}
            </div>
          </section>

          {/* Requirements */}
          {/* <section className="mb-8 space-y-4 rounded-lg p-4">
            <h3 className="mb-8 text-xl font-semibold">Requirements</h3>
            <div className="space-y-8">
              {filteredRequirements
                .sort((a, b) => (a.displayPriority ?? 0) - (b.displayPriority ?? 0))
                .map((requirement, index) => (
                  <div key={requirement.id}>
                    <label
                      htmlFor={`requirement-${requirement.id}`}
                      className="block text-sm font-medium"
                    >
                      {requirement.name}
                      {requirement.isRequired && ' *'}
                    </label>
                    {requirement.description && <p className="text-sm">{requirement.description}</p>}
                    {renderRequirementInput({...requirement, index}, {
                      register: form.register,
                      watch: form.watch,
                      setValue: form.setValue,
                      errors: form.formState.errors?.requirements?.[index]
                    })}
                    {form.formState.errors?.requirements?.[index] && (
                      <p className="mt-1 text-sm text-red-500">
                        {form.formState.errors.requirements[index]?.message}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </section> */}
        </>
      )}

      {/* Terms and Conditions */}
      <section className="mb-8 space-y-4 rounded-lg p-4">
        <h3 className="mb-8 text-xl font-semibold">Terms and Conditions</h3>
        <div className="space-y-2">
          <label
            htmlFor="terms-accepted"
            className="flex items-center space-x-3"
          >
            <input
              type="checkbox"
              id="terms-accepted"
              {...form.register("termsAccepted")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">I agree to the terms and conditions</span>
          </label>
          {form.formState.errors.termsAccepted && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.termsAccepted.message}
            </p>
          )}
        </div>
      </section>

      {/* Form Status Messages */}
      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {form.formState.isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              {/* Add loading spinner SVG path here */}
            </svg>
            Registering...
          </span>
        ) : (
          "Register as Provider"
        )}
      </button>
    </form>
  );
}

export default ServiceProviderForm;
