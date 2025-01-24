"use server";

import { redirect } from "next/navigation";

import { BillingType, Languages } from "@prisma/client";
import { put } from "@vercel/blob";

import { prisma } from "@/lib/prisma";

async function uploadToBlob(file: File, userId: string) {
  try {
    const uniqueFilename = `${Date.now()}-${userId}`;
    const blob = await put(`profile-images/${uniqueFilename}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { url: blob.url, success: true };
  } catch (error) {
    console.error("Failed to upload image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function registerServiceProvider(
  prevState: any,
  formData: FormData,
) {
  try {
    const userId = formData.get("userId") as string;
    const imageFile = formData.get("image") as File;
    const services = formData.getAll("services") as string[];
    const languages = formData.getAll("languages") as Languages[];
    const billingType = formData.get("billingType") as BillingType;

    // Handle image upload
    const imageUrl = imageFile
      ? (await uploadToBlob(imageFile, userId)).url
      : undefined;

    if (imageFile && !imageUrl) {
      return { success: false, error: "Failed to upload image" };
    }

    // Save provider data
    const provider = await prisma.serviceProvider.create({
      data: {
        userId,
        image: imageUrl,
        name: formData.get("name") as string,
        bio: formData.get("bio") as string,
        website: formData.get("website") as string,
        services: {
          connect: services.map((id) => ({ id })),
        },
        languages: {
          set: languages,
        },
        billingType,
        serviceProviderTypeId: formData.get("serviceProviderTypeId") as string,
      },
    });

    if (provider) {
      redirect("/profile/service-provider");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to register service provider" };
  }
}
