import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // First check if tables exist before trying to delete data
  try {
    await prisma.$queryRaw`SELECT 1 FROM "ProviderType" LIMIT 1`;
    await prisma.providerType.deleteMany();
    console.log('Cleared ProviderType table');
  } catch (e) {
    console.log('ProviderType table not found or empty');
  }

  try {
    await prisma.$queryRaw`SELECT 1 FROM "Service" LIMIT 1`;
    await prisma.service.deleteMany();
    console.log('Cleared Service table');
  } catch (e) {
    console.log('Service table not found or empty');
  }

  try {
    await prisma.$queryRaw`SELECT 1 FROM "RequirementType" LIMIT 1`;
    await prisma.requirementType.deleteMany();
    console.log('Cleared RequirementType table');
  } catch (e) {
    console.log('RequirementType table not found or empty');
  }

  // Create provider types
  try {
    const providerTypes = await Promise.all([
      prisma.providerType.create({
        data: {
          name: 'General Practitioner',
          description:
            'A doctor who practices primary health care. They must be licensed by the HPCSA and have medical insurance.',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Psychologist',
          description:
            'A professional who practices psychology and studies mental states, perceptual, cognitive, emotional, and social processes and behavior',
        },
      }),
    ]);
    console.log('Provider types created successfully');
  } catch (e: any) {
    console.log('Error creating provider types:', e.message);
  }

  // Create services
  try {
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'General Consultation',
          description: 'Standard medical consultation for general health concerns',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 1,
          defaultDuration: 15, // in minutes
          defaultPrice: 650.0, // in ZAR
        },
      }),
      prisma.service.create({
        data: {
          name: 'Chronic Disease Management',
          description:
            'Ongoing care and management of chronic conditions like diabetes, hypertension, and asthma',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 2,
          defaultDuration: 30,
          defaultPrice: 950.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Preventive Health Screening',
          description: 'Regular health check-ups and preventive screenings',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 3,
          defaultDuration: 30,
          defaultPrice: 950.0,
        },
      }),
      prisma.service.create({
        data: {
          name: 'Prescription Refill',
          description: 'Refill of prescription medications',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 4,
          defaultDuration: 5,
          defaultPrice: 300.0,
        },
      }),
    ]);
    console.log('Services created successfully');
  } catch (e: any) {
    console.log('Error creating services:', e.message);
  }

  // Create requirements types
  try {
    const requirements = await Promise.all([
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Membership',
          description:
            'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered',
            falseLabel: 'No, I am not registered',
            defaultValue: null, // Force user to make explicit choice
            helpText: 'You must be a registered HPCSA member to practice in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Number',
          description: 'Please provide your HPCSA registration number (e.g., MP123456)',
          isRequired: true,
          validationType: 'TEXT',
          validationConfig: {
            minLength: 8,
            maxLength: 10,
            pattern: '^MP\\d{6}$', // Regex pattern for "MP" followed by 6 digits
            patternError: 'HPCSA number must start with MP followed by 6 digits',
            caseSensitive: false, // Whether to enforce case sensitivity
            trimWhitespace: true, // Whether to remove leading/trailing whitespace
            helpText:
              'Your HPCSA number can be found on your registration certificate. It starts with "MP" followed by 6 digits. For General Practitioners, the number format is MP123456.',
            validationError:
              'Please enter a valid HPCSA number. It should start with MP followed by exactly 6 digits.',
            placeholder: 'Enter your HPCSA number (e.g., MP123456)',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration',
          description:
            'Valid HPCSA registration for practicing as a General Practitioner in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a General Practitioner in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 3,
          providerType: {
            connect: { name: 'General Practitioner' },
          },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Practice Insurance',
          description:
            'Do you have current Medical Practice Insurance (Professional Indemnity) that covers you to practice as a General Practitioner?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I have Medical Practice Insurance',
            falseLabel: 'No, I do not have Medical Practice Insurance',
            defaultValue: null,
            helpText:
              'Medical Practice Insurance (also known as Professional Indemnity) is mandatory for practicing as a GP in South Africa. Common providers include Medical Protection Society (MPS) and Medical Defence Union (MDU).',
            validationError:
              'Please confirm your Medical Practice Insurance status. This is a mandatory requirement for practicing as a GP.',
            placeholder: 'Select your Medical Practice Insurance status',
          },
          displayPriority: 4,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'GP Medical Practice Insurance',
          description: 'When does your professional indemnity insurance expire?',
          isRequired: true,
          validationType: 'FUTURE_DATE',
          validationConfig: {
            minDaysInFuture: 30,
            helpText:
              'Your Medical Practice Insurance must be valid for at least 30 days from today. Please check your insurance certificate for the expiry date. We will notify you 60 days before expiry to ensure continuous coverage.',
            validationError:
              'The expiry date must be at least 30 days in the future. If your insurance expires sooner, please renew it before continuing.',
            placeholder: 'Select insurance expiry date',
            dateFormat: 'YYYY-MM-DD',
            displayFormat: 'DD/MM/YYYY',
            warningThreshold: 60, // Days before expiry to start showing warnings
            warningText:
              'Your insurance will expire soon. Please arrange renewal to ensure continuous coverage.',
          },
          displayPriority: 5,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Practice Insurance Certificate',
          description:
            'Please upload your current Medical Practice Insurance (Professional Indemnity) certificate. This should clearly show your name, policy number, and coverage period.',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText: 'Please upload your current Medical Practice Insurance.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your Medical Practice Insurance',
          },
          displayPriority: 6,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical School',
          description: 'Which medical school did you graduate from?',
          isRequired: true,
          validationType: 'PREDEFINED_LIST',
          validationConfig: {
            options: [
              { value: 'UCT', label: 'University of Cape Town' },
              { value: 'WITS', label: 'University of the Witwatersrand' },
              { value: 'UP', label: 'University of Pretoria' },
              { value: 'SU', label: 'Stellenbosch University' },
              { value: 'UKZN', label: 'University of KwaZulu-Natal' },
              { value: 'UFS', label: 'University of the Free State' },
              { value: 'WSU', label: 'Walter Sisulu University' },
              {
                value: 'SMU',
                label: 'Sefako Makgatho Health Sciences University',
              },
            ],
            allowMultiple: false,
            allowOther: true,
            otherLabel: 'Other medical school (please specify)',
            otherValidation: {
              minLength: 3,
              maxLength: 100,
              required: true,
            },
            helpText:
              'Select your medical school from the list. If you graduated from an institution outside South Africa or one not listed, please select "Other" and provide the full name of your medical school.',
            validationError:
              'Please select a medical school or enter the name of your institution if not listed. The name must be between 3 and 100 characters.',
            placeholder: 'Select your medical school',
          },
          displayPriority: 7,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical School Graduation Year',
          description: 'In which year did you graduate from medical school?',
          isRequired: true,
          validationType: 'PAST_DATE',
          validationConfig: {
            dateFormat: 'YYYY', // Only capture the year
            minYear: 1960, // Reasonable lower bound
            maxYear: new Date().getFullYear(), // Cannot be in the future
            displayFormat: 'Year only',
            placeholder: '2015',
            helpText: 'Please enter the year you completed your medical degree (MBChB/MBBS)',
            validationError: 'Please enter a valid graduation year. It cannot be in the future.',
          },
          displayPriority: 8,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'Medical Degree Certificate',
          description:
            'Please upload a copy of your medical degree certificate (MBChB/MBBCh/MBBS/MD)',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: ['PDF'],
            maxSizeMB: 5,
            helpText:
              'Please upload a clear, complete scan of your original medical degree certificate.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your medical degree certificate',
          },
          displayPriority: 9,
          providerType: { connect: { name: 'General Practitioner' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Membership',
          description:
            'Are you currently registered as a member of the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered',
            falseLabel: 'No, I am not registered',
            defaultValue: null, // Force user to make explicit choice
            helpText: 'You must be a registered HPCSA member to practice in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Number',
          description: 'Please provide your HPCSA registration number (e.g., PS123456)',
          isRequired: true,
          validationType: 'TEXT',
          validationConfig: {
            minLength: 8,
            maxLength: 10,
            pattern: '^PS\\d{6}$', // Regex pattern for "PS" followed by 6 digits
            patternError: 'HPCSA number must start with PS followed by 6 digits',
            caseSensitive: false, // Whether to enforce case sensitivity
            trimWhitespace: true, // Whether to remove leading/trailing whitespace
            helpText:
              'Your HPCSA number can be found on your registration certificate. It starts with "PS" followed by 6 digits. For Psychologists, the number format is PS123456.',
            validationError:
              'Please enter a valid HPCSA number. It should start with PS followed by exactly 6 digits.',
            placeholder: 'Enter your HPCSA number (e.g., PS123456)',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration',
          description: 'Valid HPCSA registration for practicing as a Psychologist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Psychologist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 3,
          providerType: { connect: { name: 'Psychologist' } },
        },
      }),
    ]);

    // eslint-disable-next-line no-console
    console.log('requirements', requirements);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error during seeding:', error);
    throw error;
  }

  // Create sample availability data demonstrating new scheduling features
  try {
    console.log('Creating sample availability data...');

    // Note: This creates sample data structure only - actual users/providers would be created by the application
    // This demonstrates the schema structure for the new availability fields

    const sampleAvailabilityData = [
      {
        // Single availability with continuous scheduling
        description: 'Standard morning availability - continuous scheduling',
        schedulingRule: 'CONTINUOUS',
        isRecurring: false,
        isOnlineAvailable: true,
        requiresConfirmation: false,
      },
      {
        // Recurring availability with fixed interval scheduling
        description: 'Weekly recurring availability - fixed intervals on the hour',
        schedulingRule: 'FIXED_INTERVAL',
        isRecurring: true,
        seriesId: 'weekly-morning-slots',
        recurrencePattern: {
          type: 'weekly',
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          startTime: '09:00',
          endTime: '17:00',
          endDate: '2024-12-31',
        },
        isOnlineAvailable: false,
        requiresConfirmation: true,
      },
      {
        // Custom interval scheduling example
        description: 'Custom 20-minute interval scheduling for consultations',
        schedulingRule: 'CUSTOM_INTERVAL',
        schedulingInterval: 20,
        isRecurring: false,
        isOnlineAvailable: true,
        requiresConfirmation: false,
      },
    ];

    console.log('Sample availability configurations:', sampleAvailabilityData);
    console.log('Sample availability data structure created for reference');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating sample availability data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
