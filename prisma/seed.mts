import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear all existing data in correct order (children first, then parents)
  console.log('Clearing existing data...');

  // Delete requirement submissions first (they reference RequirementType)
  await prisma.requirementSubmission.deleteMany();
  console.log('Cleared RequirementSubmission table');

  // Delete service availability configs (they reference Service)
  await prisma.serviceAvailabilityConfig.deleteMany();
  console.log('Cleared ServiceAvailabilityConfig table');

  // Now delete the parent tables
  await prisma.requirementType.deleteMany();
  console.log('Cleared RequirementType table');

  await prisma.service.deleteMany();
  console.log('Cleared Service table');

  await prisma.providerType.deleteMany();
  console.log('Cleared ProviderType table');

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
      prisma.providerType.create({
        data: {
          name: 'Dentist',
          description:
            'A healthcare professional qualified to practice dentistry, providing oral health care services',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Speech Therapist',
          description:
            'A healthcare professional who evaluates and treats communication and swallowing disorders',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Physiotherapist',
          description:
            'A healthcare professional who helps restore movement and function through physical therapy',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Occupational Therapist',
          description:
            'A healthcare professional who helps people participate in daily activities through therapeutic interventions',
        },
      }),
      prisma.providerType.create({
        data: {
          name: 'Dietitian',
          description:
            'A healthcare professional who specializes in human nutrition and the regulation of diet',
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
          name: 'General GP Consult',
          description: 'Standard medical consultation for general health concerns',
          providerType: { connect: { name: 'General Practitioner' } },
          displayPriority: 1,
          defaultDuration: 15, // in minutes
          defaultPrice: 600.0, // in ZAR
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
      // Psychologist services
      prisma.service.create({
        data: {
          name: 'General Psychology Consult',
          description: 'Standard psychological consultation for mental health concerns',
          providerType: { connect: { name: 'Psychologist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      // Dentist services
      prisma.service.create({
        data: {
          name: 'General Dental Consult',
          description: 'Standard dental consultation and examination',
          providerType: { connect: { name: 'Dentist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      // Speech Therapist services
      prisma.service.create({
        data: {
          name: 'General Speech Therapy Consult',
          description: 'Standard speech therapy consultation and assessment',
          providerType: { connect: { name: 'Speech Therapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      // Physiotherapist services
      prisma.service.create({
        data: {
          name: 'General Physiotherapy Consult',
          description: 'Standard physiotherapy consultation and assessment',
          providerType: { connect: { name: 'Physiotherapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      // Occupational Therapist services
      prisma.service.create({
        data: {
          name: 'General Occupational Therapy Consult',
          description: 'Standard occupational therapy consultation and assessment',
          providerType: { connect: { name: 'Occupational Therapist' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
        },
      }),
      // Dietitian services
      prisma.service.create({
        data: {
          name: 'General Dietitian Consult',
          description: 'Standard nutrition consultation and dietary assessment',
          providerType: { connect: { name: 'Dietitian' } },
          displayPriority: 1,
          defaultDuration: 15,
          defaultPrice: 600.0,
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
            pattern: '^MP\\\\d{6}$', // Regex pattern for "MP" followed by 6 digits
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
      // Dentist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Dentist',
          description:
            'Are you currently registered as a Dentist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Dentist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Dentist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Dentist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Dentist',
          description:
            'Valid HPCSA registration certificate for practicing as a Dentist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Dentist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Dentist' } },
        },
      }),
      // Speech Therapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Speech Therapist',
          description:
            'Are you currently registered as a Speech Therapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Speech Therapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Speech Therapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Speech Therapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Speech Therapist',
          description:
            'Valid HPCSA registration certificate for practicing as a Speech Therapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Speech Therapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Speech Therapist' } },
        },
      }),
      // Physiotherapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Physiotherapist',
          description:
            'Are you currently registered as a Physiotherapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Physiotherapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Physiotherapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Physiotherapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Physiotherapist',
          description:
            'Valid HPCSA registration certificate for practicing as a Physiotherapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Physiotherapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Physiotherapist' } },
        },
      }),
      // Occupational Therapist requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Occupational Therapist',
          description:
            'Are you currently registered as an Occupational Therapist with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as an Occupational Therapist',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as an Occupational Therapist in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Occupational Therapist' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Occupational Therapist',
          description:
            'Valid HPCSA registration certificate for practicing as an Occupational Therapist in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as an Occupational Therapist in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Occupational Therapist' } },
        },
      }),
      // Dietitian requirements
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration - Dietitian',
          description:
            'Are you currently registered as a Dietitian with the Health Professions Council of South Africa (HPCSA)?',
          isRequired: true,
          validationType: 'BOOLEAN',
          validationConfig: {
            trueLabel: 'Yes, I am registered as a Dietitian',
            falseLabel: 'No, I am not registered',
            defaultValue: null,
            helpText:
              'You must be a registered HPCSA member to practice as a Dietitian in South Africa',
            validationError:
              'Please confirm your HPCSA registration status. This is a mandatory requirement.',
            placeholder: 'Select your HPCSA registration status',
          },
          displayPriority: 1,
          providerType: { connect: { name: 'Dietitian' } },
        },
      }),
      prisma.requirementType.create({
        data: {
          name: 'HPCSA Registration Document - Dietitian',
          description:
            'Valid HPCSA registration certificate for practicing as a Dietitian in South Africa',
          isRequired: true,
          validationType: 'DOCUMENT',
          validationConfig: {
            expectedFormat: 'PDF',
            maxSizeMB: 5,
            helpText:
              'Please upload your valid HPCSA registration for practicing as a Dietitian in South Africa.',
            validationError: 'Please upload a PDF document that is less than 5MB in size.',
            placeholder: 'Upload your valid HPCSA registration',
          },
          displayPriority: 2,
          providerType: { connect: { name: 'Dietitian' } },
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

  // Create sample Users and Providers for Docker development
  try {
    console.log('Creating sample users and providers for development...');

    // Create sample users
    const sampleUsers = await Promise.all([
      prisma.user.create({
        data: {
          id: 'user-dr-smith-001',
          name: 'Dr. Sarah Smith',
          email: 'dr.sarah.smith@example.com',
          role: 'USER',
          image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
          phone: '+27821234567',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      }),
      prisma.user.create({
        data: {
          id: 'user-dr-jones-002',
          name: 'Dr. Michael Jones',
          email: 'dr.michael.jones@example.com',
          role: 'USER',
          image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
          phone: '+27821234568',
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      }),
      prisma.user.create({
        data: {
          id: 'user-dr-patel-003',
          name: 'Dr. Priya Patel',
          email: 'dr.priya.patel@example.com',
          role: 'USER',
          image: 'https://images.unsplash.com/photo-1594824092862-b51e6168b01e?w=400',
          phone: '+27821234569',
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
      }),
    ]);
    console.log('Sample users created:', sampleUsers.length);

    // Create sample providers
    const sampleProviders = await Promise.all([
      prisma.provider.create({
        data: {
          id: 'provider-dr-smith-001',
          name: 'Dr. Sarah Smith',
          userId: 'user-dr-smith-001',
          bio: 'Experienced General Practitioner with 15+ years of practice. Specializes in family medicine, preventive care, and chronic disease management.',
          image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
          languages: ['English', 'Afrikaans'],
          website: 'https://drsarahsmith.co.za',
          email: 'dr.sarah.smith@example.com',
          whatsapp: '+27821234567',
          showPrice: true,
          status: 'APPROVED',
          approvedAt: new Date('2024-01-15T10:00:00Z'),
          averageRating: 4.8,
          totalReviews: 127,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
      }),
      prisma.provider.create({
        data: {
          id: 'provider-dr-jones-002',
          name: 'Dr. Michael Jones',
          userId: 'user-dr-jones-002',
          bio: 'Clinical Psychologist specializing in anxiety, depression, and trauma therapy. Uses evidence-based approaches including CBT and mindfulness.',
          image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
          languages: ['English', 'IsiZulu'],
          website: 'https://drmichaeljones.co.za',
          email: 'dr.michael.jones@example.com',
          whatsapp: '+27821234568',
          showPrice: true,
          status: 'APPROVED',
          approvedAt: new Date('2024-01-16T10:00:00Z'),
          averageRating: 4.6,
          totalReviews: 89,
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      }),
      prisma.provider.create({
        data: {
          id: 'provider-dr-patel-003',
          name: 'Dr. Priya Patel',
          userId: 'user-dr-patel-003',
          bio: 'Qualified Dentist with expertise in general dentistry, cosmetic procedures, and oral surgery. Committed to pain-free, comfortable dental care.',
          image: 'https://images.unsplash.com/photo-1594824092862-b51e6168b01e?w=400',
          languages: ['English', 'Afrikaans', 'IsiZulu'],
          website: 'https://drpriyapatel.co.za',
          email: 'dr.priya.patel@example.com',
          whatsapp: '+27821234569',
          showPrice: true,
          status: 'APPROVED',
          approvedAt: new Date('2024-01-17T10:00:00Z'),
          averageRating: 4.9,
          totalReviews: 203,
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
      }),
    ]);
    console.log('Sample providers created:', sampleProviders.length);

    // Create provider type assignments
    await Promise.all([
      prisma.providerTypeAssignment.create({
        data: {
          providerId: 'provider-dr-smith-001',
          providerTypeId: (await prisma.providerType.findUnique({
            where: { name: 'General Practitioner' },
          }))!.id,
        },
      }),
      prisma.providerTypeAssignment.create({
        data: {
          providerId: 'provider-dr-jones-002',
          providerTypeId: (await prisma.providerType.findUnique({
            where: { name: 'Psychologist' },
          }))!.id,
        },
      }),
      prisma.providerTypeAssignment.create({
        data: {
          providerId: 'provider-dr-patel-003',
          providerTypeId: (await prisma.providerType.findUnique({ where: { name: 'Dentist' } }))!
            .id,
        },
      }),
    ]);
    console.log('Provider type assignments created');

    // Fetch services for availability creation
    const gpService = await prisma.service.findFirst({ where: { name: 'General GP Consult' } });
    const psychService = await prisma.service.findFirst({
      where: { name: 'General Psychology Consult' },
    });
    const dentalService = await prisma.service.findFirst({
      where: { name: 'General Dental Consult' },
    });

    if (!gpService || !psychService || !dentalService) {
      throw new Error('Required services not found for availability creation');
    }

    // Create sample availability records
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const sampleAvailabilities = await Promise.all([
      // Dr. Smith - GP availability (tomorrow 9 AM - 5 PM)
      prisma.availability.create({
        data: {
          id: 'availability-dr-smith-001',
          providerId: 'provider-dr-smith-001',
          startTime: new Date(tomorrow.setHours(9, 0, 0, 0)),
          endTime: new Date(tomorrow.setHours(17, 0, 0, 0)),
          createdById: 'user-dr-smith-001',
          isProviderCreated: true,
          status: 'ACCEPTED',
          acceptedById: 'user-dr-smith-001',
          acceptedAt: new Date(),
          schedulingRule: 'ON_THE_HOUR',
          isRecurring: false,
          isOnlineAvailable: true,
          requiresConfirmation: false,
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
      }),
      // Dr. Jones - Psychology availability (day after tomorrow 10 AM - 4 PM)
      prisma.availability.create({
        data: {
          id: 'availability-dr-jones-002',
          providerId: 'provider-dr-jones-002',
          startTime: new Date(dayAfterTomorrow.setHours(10, 0, 0, 0)),
          endTime: new Date(dayAfterTomorrow.setHours(16, 0, 0, 0)),
          createdById: 'user-dr-jones-002',
          isProviderCreated: true,
          status: 'ACCEPTED',
          acceptedById: 'user-dr-jones-002',
          acceptedAt: new Date(),
          schedulingRule: 'ON_THE_HALF_HOUR',
          isRecurring: false,
          isOnlineAvailable: true,
          requiresConfirmation: true,
          createdAt: new Date('2024-01-16T10:00:00Z'),
        },
      }),
      // Dr. Patel - Dental availability (tomorrow 8 AM - 12 PM)
      prisma.availability.create({
        data: {
          id: 'availability-dr-patel-003',
          providerId: 'provider-dr-patel-003',
          startTime: new Date(tomorrow.setHours(8, 0, 0, 0)),
          endTime: new Date(tomorrow.setHours(12, 0, 0, 0)),
          createdById: 'user-dr-patel-003',
          isProviderCreated: true,
          status: 'ACCEPTED',
          acceptedById: 'user-dr-patel-003',
          acceptedAt: new Date(),
          schedulingRule: 'CONTINUOUS',
          isRecurring: false,
          isOnlineAvailable: false,
          requiresConfirmation: false,
          createdAt: new Date('2024-01-17T10:00:00Z'),
        },
      }),
    ]);
    console.log('Sample availabilities created:', sampleAvailabilities.length);

    // Create service availability configurations for each provider-service combination
    const serviceConfigs = await Promise.all([
      // Dr. Smith - GP service config
      prisma.serviceAvailabilityConfig.create({
        data: {
          id: 'service-config-smith-gp',
          providerId: 'provider-dr-smith-001',
          serviceId: gpService.id,
          duration: 15, // 15-minute consultations
          price: 600.0,
          isOnlineAvailable: true,
          isInPerson: true,
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
      }),
      // Dr. Jones - Psychology service config
      prisma.serviceAvailabilityConfig.create({
        data: {
          id: 'service-config-jones-psych',
          providerId: 'provider-dr-jones-002',
          serviceId: psychService.id,
          duration: 30, // 30-minute consultations
          price: 800.0,
          isOnlineAvailable: true,
          isInPerson: false,
          createdAt: new Date('2024-01-16T10:00:00Z'),
        },
      }),
      // Dr. Patel - Dental service config
      prisma.serviceAvailabilityConfig.create({
        data: {
          id: 'service-config-patel-dental',
          providerId: 'provider-dr-patel-003',
          serviceId: dentalService.id,
          duration: 20, // 20-minute consultations
          price: 750.0,
          isOnlineAvailable: false,
          isInPerson: true,
          createdAt: new Date('2024-01-17T10:00:00Z'),
        },
      }),
    ]);
    console.log('Service availability configurations created:', serviceConfigs.length);

    // Create calculated availability slots for guest viewing
    const calculateSlots = (startTime: Date, endTime: Date, duration: number, rule: string) => {
      const slots = [];
      let current = new Date(startTime);

      while (current < endTime) {
        const slotEnd = new Date(current.getTime() + duration * 60000); // duration in milliseconds
        if (slotEnd <= endTime) {
          slots.push({
            startTime: new Date(current),
            endTime: slotEnd,
          });
        }

        // Advance based on scheduling rule
        if (rule === 'ON_THE_HOUR') {
          current.setHours(current.getHours() + 1);
        } else if (rule === 'ON_THE_HALF_HOUR') {
          current.setMinutes(current.getMinutes() + 30);
        } else {
          // CONTINUOUS
          current = slotEnd;
        }
      }
      return slots;
    };

    // Generate slots for each availability
    const slotsToCreate: Array<{
      id: string;
      availabilityId: string;
      serviceId: string;
      serviceConfigId: string;
      startTime: Date;
      endTime: Date;
      status: 'AVAILABLE';
      lastCalculated: Date;
      createdAt: Date;
    }> = [];

    // Dr. Smith slots (9 AM - 5 PM, hourly, 15-min duration)
    const smithSlots = calculateSlots(
      sampleAvailabilities[0].startTime,
      sampleAvailabilities[0].endTime,
      15,
      'ON_THE_HOUR'
    );
    smithSlots.forEach((slot, index) => {
      slotsToCreate.push({
        id: `slot-smith-${index + 1}`,
        availabilityId: 'availability-dr-smith-001',
        serviceId: gpService.id,
        serviceConfigId: 'service-config-smith-gp',
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'AVAILABLE' as const,
        lastCalculated: new Date(),
        createdAt: new Date('2024-01-15T10:00:00Z'),
      });
    });

    // Dr. Jones slots (10 AM - 4 PM, every 30 min, 30-min duration)
    const jonesSlots = calculateSlots(
      sampleAvailabilities[1].startTime,
      sampleAvailabilities[1].endTime,
      30,
      'ON_THE_HALF_HOUR'
    );
    jonesSlots.forEach((slot, index) => {
      slotsToCreate.push({
        id: `slot-jones-${index + 1}`,
        availabilityId: 'availability-dr-jones-002',
        serviceId: psychService.id,
        serviceConfigId: 'service-config-jones-psych',
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'AVAILABLE' as const,
        lastCalculated: new Date(),
        createdAt: new Date('2024-01-16T10:00:00Z'),
      });
    });

    // Dr. Patel slots (8 AM - 12 PM, continuous, 20-min duration)
    const patelSlots = calculateSlots(
      sampleAvailabilities[2].startTime,
      sampleAvailabilities[2].endTime,
      20,
      'CONTINUOUS'
    );
    patelSlots.forEach((slot, index) => {
      slotsToCreate.push({
        id: `slot-patel-${index + 1}`,
        availabilityId: 'availability-dr-patel-003',
        serviceId: dentalService.id,
        serviceConfigId: 'service-config-patel-dental',
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'AVAILABLE' as const,
        lastCalculated: new Date(),
        createdAt: new Date('2024-01-17T10:00:00Z'),
      });
    });

    // Create all slots
    const calculatedSlots = await Promise.all(
      slotsToCreate.map((slot) => prisma.calculatedAvailabilitySlot.create({ data: slot }))
    );
    console.log('Calculated availability slots created:', calculatedSlots.length);

    console.log('Development seed data created successfully:');
    console.log(`- ${sampleUsers.length} sample users`);
    console.log(`- ${sampleProviders.length} sample providers`);
    console.log(`- ${sampleAvailabilities.length} sample availabilities`);
    console.log(`- ${serviceConfigs.length} service configurations`);
    console.log(`- ${calculatedSlots.length} calculated slots`);
  } catch (error) {
    console.error('Error creating development seed data:', error);
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
