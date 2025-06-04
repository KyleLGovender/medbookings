'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Languages } from '@prisma/client';
import { useFormState } from 'react-dom';
import { useForm, useWatch } from 'react-hook-form';

import { renderRequirementInput } from '@/components/forms/render-requirement-input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { registerServiceProvider, updateServiceProvider } from '@/features/providers/lib/actions';
import { ServiceProviderFormType, serviceProviderSchema } from '@/features/providers/types/types';

const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

type FormMode = 'register' | 'edit';

interface Props {
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
  userId: string;
  mode: FormMode;
  initialData?: Partial<ServiceProviderFormType> & {
    id?: string;
    requirementSubmissions?: Array<{
      requirementTypeId: string;
      documentUrl: string | null;
      documentMetadata: { value?: string } | null;
    }>;
  };
}

function ServiceProviderForm({
  serviceProviderTypes,
  services,
  requirementTypes,
  languages,
  userId,
  mode = 'register',
  initialData = {},
}: Props): JSX.Element {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(
    // Use existing image URL as preview if in edit mode
    mode === 'edit' && initialData?.image ? initialData.image : null
  );

  // Select appropriate server action based on mode
  const serverAction = mode === 'register' ? registerServiceProvider : updateServiceProvider;
  const [state, formAction] = useFormState(serverAction, null);
  const [isPending, startTransition] = React.useTransition();

  // Set up form with initial values based on mode
  const form = useForm<ServiceProviderFormType>({
    resolver: zodResolver(serviceProviderSchema),
    defaultValues: {
      userId: userId,
      serviceProviderTypeId: initialData?.serviceProviderTypeId || '',
      name: initialData?.name || '',
      bio: initialData?.bio || '',
      image: null, // File input can't have a default string value
      languages: initialData?.languages || [],
      website: initialData?.website || '',
      email: initialData?.email || '',
      whatsapp: initialData?.whatsapp || '',
      services: initialData?.services || [],
      requirements: initialData?.requirements || [],
      termsAccepted: mode === 'edit' ? true : undefined, // Auto-accept terms in edit mode
    },
  });

  // Watch for successful registration and redirect
  useEffect(() => {
    if (state?.success && state.redirect) {
      router.push(state.redirect);
    }
  }, [state, router]);

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
    name: 'serviceProviderTypeId',
  });

  const filteredServices = services.filter((service) =>
    selectedProviderType ? service.serviceProviderTypeId === selectedProviderType : false
  );

  const filteredRequirements = requirementTypes.filter((requirement) =>
    selectedProviderType ? requirement.serviceProviderTypeId === selectedProviderType : false
  );

  // Add this near the top of the component
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log('Form validation errors:', form.formState.errors);
    }
  }, [form.formState.errors]);

  const onSubmit = async (data: ServiceProviderFormType) => {
    const formData = new FormData();

    // Add ID if in edit mode
    if (mode === 'edit' && initialData?.id) {
      formData.append('id', initialData.id);
    }

    // Handle basic fields
    Object.entries(data).forEach(([key, value]) => {
      // Skip requirements as we'll handle them separately
      if (key === 'requirements') return;

      // Skip image if it's null and we're in edit mode
      if (key === 'image' && !value && mode === 'edit') return;

      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      } else if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    // Handle requirements properly
    const requirements = data.requirements || [];
    requirements.forEach((requirement, index) => {
      // Append requirement metadata
      formData.append(`requirements[${index}][requirementTypeId]`, requirement.requirementTypeId);
      if (requirement.value) {
        formData.append(`requirements[${index}][value]`, requirement.value);
      }
      if (requirement.documentUrl) {
        formData.append(`requirements[${index}][documentUrl]`, requirement.documentUrl);
      }

      // Handle file upload if present
      if (requirement.documentFile instanceof File) {
        formData.append(`requirements[${index}][documentFile]`, requirement.documentFile);
      }
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* If editing, include hidden ID field */}
        {mode === 'edit' && initialData?.id && (
          <input type="hidden" name="id" value={initialData.id} />
        )}
        <input type="hidden" {...form.register('userId')} value={userId} />

        {/* Service Provider Details */}
        <section className="mb-8 space-y-4 rounded-lg p-4">
          <h3 className="mb-8 text-xl font-semibold">
            {mode === 'register' ? 'Service Provider Details' : 'Edit Profile'}
          </h3>

          {/* Service Provider Type */}
          <div className="space-y-2">
            <label htmlFor="provider-type-label" className="block text-sm font-medium">
              Provider Type
              <select
                id="provider-type-label"
                {...form.register('serviceProviderTypeId')}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
              <input
                type="text"
                id="name"
                {...form.register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </label>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                id="email"
                {...form.register('email')}
                placeholder="your@email.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </label>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
              WhatsApp Number
              <input
                type="tel"
                id="whatsapp"
                {...form.register('whatsapp')}
                placeholder="+1234567890"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {form.formState.errors.whatsapp && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.whatsapp.message}
                </p>
              )}
            </label>
            <p className="text-sm text-gray-500">Include country code (e.g., +1 for US)</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
              <textarea
                id="bio"
                {...form.register('bio')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
              />
              {form.formState.errors.bio && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.bio.message}</p>
              )}
            </label>
          </div>

          {/* Image Upload with Preview */}
          <div className="space-y-4">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700">
              Profile Image
              <input
                type="file"
                id="image"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                {...form.register('image', {
                  onChange: (e) => {
                    console.log('File selected:', e.target.files);
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
                  sizes="128px"
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
            <label htmlFor="languages" className="block text-sm font-medium text-gray-700">
              Languages Spoken
              <select
                id="languages"
                multiple
                {...form.register('languages')}
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
            <p className="text-sm text-gray-500">Hold Ctrl/Cmd to select multiple languages</p>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
              <input
                type="url"
                id="website"
                {...form.register('website')}
                placeholder="https://example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {form.formState.errors.website && (
                <p className="mt-1 text-sm text-red-500">{form.formState.errors.website.message}</p>
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
                        {...form.register('services')}
                        className={`h-4 w-4 rounded border-gray-300 ${
                          form.formState.errors.services ? 'border-red-500' : ''
                        }`}
                      />
                      <span className="text-sm text-gray-700">{service.name}</span>
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
            <section className="mb-8 space-y-4 rounded-lg p-4">
              <h3 className="mb-8 text-xl font-semibold">Requirements</h3>
              <div className="space-y-8">
                {filteredRequirements
                  .sort((a, b) => (a.displayPriority ?? 0) - (b.displayPriority ?? 0))
                  .map((requirement, index) => {
                    // Check for existing submission for this requirement
                    const existingSubmission = initialData?.requirementSubmissions?.find(
                      (sub) => sub.requirementTypeId === requirement.id
                    );

                    return (
                      <div key={requirement.id}>
                        <label
                          htmlFor={`requirement-${requirement.id}`}
                          className="block text-sm font-medium"
                        >
                          {requirement.name}
                          {!existingSubmission && requirement.isRequired && ' *'}
                        </label>
                        {requirement.description && (
                          <p className="text-sm">{requirement.description}</p>
                        )}
                        {renderRequirementInput(
                          {
                            ...requirement,
                            index,
                            isRequired: existingSubmission ? false : requirement.isRequired,
                            existingSubmission,
                          },
                          {
                            register: form.register,
                            watch: form.watch,
                            setValue: form.setValue,
                            errors: form.formState.errors?.requirements?.[index],
                          }
                        )}
                        {form.formState.errors?.requirements?.[index] && (
                          <p className="mt-1 text-sm text-red-500">
                            {form.formState.errors.requirements[index]?.message ||
                              'This field is required'}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          </>
        )}

        {/* Terms and Conditions */}

        <section className="mb-8 space-y-4 rounded-lg p-4">
          <h3 className="mb-8 text-xl font-semibold">Terms and Conditions</h3>
          <div className="space-y-2">
            <label htmlFor="terms-accepted" className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="terms-accepted"
                {...form.register('termsAccepted')}
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
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{state.error}</div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="max-w-64">
            {isPending ? (
              <span className="flex items-center justify-center">
                <Spinner className="mr-2 h-4 w-4" />
                {mode === 'register' ? 'Registering...' : 'Updating Profile...'}
              </span>
            ) : mode === 'register' ? (
              'Register as Provider'
            ) : (
              'Update Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ServiceProviderForm;
